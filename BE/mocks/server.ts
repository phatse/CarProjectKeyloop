// Mock upstream systems for Scenario D.
//
// One process per system, each owning its own Postgres schema:
//   MOCK_SYSTEM=sales   node mocks/server.ts   -> :4001
//   MOCK_SYSTEM=service node mocks/server.ts   -> :4002
//
// The payload shapes differ on purpose. The API can only read this data over
// HTTP, never by joining schemas, and its adapters must normalise both shapes
// into one Document (ADR-0003, RFC-0001).

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { Pool } from 'pg'

type MockSystem = 'sales' | 'service'

type SystemConfig = {
  port: number
  documentsSql: string
  wrap: (vin: string, rows: Record<string, unknown>[]) => unknown
}

const systems: Record<MockSystem, SystemConfig> = {
  sales: {
    port: 4001,
    documentsSql: `
      SELECT id,
             doc_type AS "docType",
             title,
             to_char(signed_on, 'YYYY-MM-DD') AS "signedOn",
             amount,
             currency,
             file_url AS "fileUrl"
      FROM sales_system.document
      WHERE vin = $1
      ORDER BY signed_on DESC, id
    `,
    wrap: (vin, rows) => ({ vin, documents: rows }),
  },
  service: {
    port: 4002,
    documentsSql: `
      SELECT id AS ref,
             kind,
             label AS name,
             to_char(performed_on, 'YYYY-MM-DD') AS "date",
             total,
             link
      FROM service_system.document
      WHERE vin = $1
      ORDER BY performed_on DESC, id
    `,
    wrap: (vin, rows) => ({ vehicle: vin, items: rows }),
  },
}

const systemName = process.env.MOCK_SYSTEM
if (systemName !== 'sales' && systemName !== 'service') {
  console.error('MOCK_SYSTEM must be "sales" or "service"')
  process.exit(1)
}

const config = systems[systemName]
const port = Number(process.env.PORT ?? config.port)
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://carproject:carproject@localhost:5432/carproject'

const pool = new Pool({ connectionString: databaseUrl })

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const startedAt = Date.now()
  const url = new URL(request.url ?? '/', `http://localhost:${port}`)

  const send = (status: number, body: unknown): void => {
    response.writeHead(status, { 'content-type': 'application/json' })
    response.end(JSON.stringify(body))
    const elapsed = Date.now() - startedAt
    console.log(`${request.method} ${url.pathname}${url.search} -> ${status} ${elapsed}ms`)
  }

  if (url.pathname === '/health') {
    send(200, { status: 'ok', system: systemName })
    return
  }

  if (url.pathname !== '/documents') {
    send(404, { error: 'not found' })
    return
  }

  const vin = url.searchParams.get('vin')?.trim().toUpperCase()
  if (!vin) {
    send(400, { error: 'vin query parameter is required' })
    return
  }

  // Fault injection: ?delay=5000 simulates a slow system, ?fail=true a dead one.
  const delay = Number(url.searchParams.get('delay') ?? 0)
  if (Number.isFinite(delay) && delay > 0) {
    await sleep(delay)
  }

  if (url.searchParams.get('fail') === 'true') {
    send(500, { error: `${systemName} system unavailable (simulated)` })
    return
  }

  try {
    const result = await pool.query<Record<string, unknown>>(config.documentsSql, [vin])
    send(200, config.wrap(vin, result.rows))
  } catch (error) {
    console.error(error)
    send(500, { error: 'database query failed' })
  }
}

const server = createServer((request, response) => {
  void handle(request, response)
})

server.listen(port, () => {
  console.log(`${systemName} mock listening on http://localhost:${port}`)
})

const shutdown = async (): Promise<void> => {
  server.close()
  await pool.end()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())

import { type ChildProcess, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { join } from 'node:path'
import type { INestApplication } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../../src/app.module.js'
import type { Env } from '../../src/config/env.js'
import { SalesAdapter } from '../../src/documents/adapters/sales.adapter.js'
import { ServiceAdapter } from '../../src/documents/adapters/service.adapter.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'

const VIN = '1HGCM82633A004352'
const BE_ROOT = join(import.meta.dirname, '../..')

const mocks: ChildProcess[] = []
let salesUrl: string
let serviceUrl: string
let deadUrl: string

// A port the OS just handed out and released: connecting to it fails fast.
const freePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        reject(new Error('could not allocate a port'))
        return
      }

      const { port } = address
      server.close(() => resolve(port))
    })
  })

const startMock = (system: 'sales' | 'service', port: number): void => {
  mocks.push(
    spawn(process.execPath, ['--env-file-if-exists=.env', 'mocks/server.ts'], {
      cwd: BE_ROOT,
      env: { ...process.env, MOCK_SYSTEM: system, PORT: String(port) },
      stdio: 'ignore',
    }),
  )
}

// Checks the system name too: a stale process from another run is not accepted.
const waitForMock = async (port: number, system: 'sales' | 'service'): Promise<void> => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`)
      const body = (await response.json()) as { system?: string }
      if (response.ok && body.system === system) {
        return
      }
    } catch {
      // not listening yet
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`${system} mock did not start on port ${port}`)
}

const stopMocks = async (): Promise<void> => {
  await Promise.all(
    mocks.map(
      (mock) =>
        new Promise<void>((resolve) => {
          if (mock.exitCode !== null) {
            resolve()
            return
          }

          const timer = setTimeout(() => {
            mock.kill('SIGKILL')
            resolve()
          }, 2000)

          mock.once('exit', () => {
            clearTimeout(timer)
            resolve()
          })
          mock.kill('SIGTERM')
        }),
    ),
  )
}

type AppUrls = { sales?: string; service?: string }

// The adapters take their base URL from ConfigService. Pointing them at the
// test mocks (or a dead port) is a provider override, not an env mutation:
// ConfigModule.forRoot reads process.env when AppModule is imported.
const configFor = (url: string): ConfigService<Env, true> =>
  ({
    getOrThrow: (key: string) => {
      if (key === 'UPSTREAM_TIMEOUT_MS') {
        return 1500
      }

      if (key === 'SALES_API_URL' || key === 'SERVICE_API_URL') {
        return url
      }

      throw new Error(`unexpected config key: ${key}`)
    },
  }) as unknown as ConfigService<Env, true>

const createApp = async ({ sales = salesUrl, service = serviceUrl }: AppUrls = {}) => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SalesAdapter)
    .useValue(new SalesAdapter(configFor(sales)))
    .overrideProvider(ServiceAdapter)
    .useValue(new ServiceAdapter(configFor(service)))
    .compile()

  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()

  return app
}

const withApp = async (
  urls: AppUrls,
  run: (app: INestApplication) => Promise<void>,
): Promise<void> => {
  const app = await createApp(urls)

  try {
    await run(app)
  } finally {
    await app.close()
  }
}

describe('Documents (e2e)', () => {
  beforeAll(async () => {
    const salesPort = await freePort()
    const servicePort = await freePort()

    deadUrl = `http://127.0.0.1:${await freePort()}`
    salesUrl = `http://127.0.0.1:${salesPort}`
    serviceUrl = `http://127.0.0.1:${servicePort}`

    startMock('sales', salesPort)
    startMock('service', servicePort)
    await Promise.all([waitForMock(salesPort, 'sales'), waitForMock(servicePort, 'service')])
  })

  afterAll(async () => {
    await stopMocks()
  })

  it('returns COMPLETE in contract order and writes an audit row', async () => {
    await withApp({}, async (app) => {
      const correlationId = randomUUID()

      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${VIN.toLowerCase()}/documents`)
        .set('x-correlation-id', correlationId)
        .expect(200)

      expect(response.headers['x-correlation-id']).toBe(correlationId)
      expect(response.body.vin).toBe(VIN)
      expect(response.body.meta).toMatchObject({
        status: 'COMPLETE',
        sources: { SALES: 'OK', SERVICE: 'OK' },
      })
      expect(response.body.documents.map((document: { id: string }) => document.id)).toEqual([
        'SERVICE:SVC-88215',
        'SERVICE:SVC-88214',
        'SERVICE:SVC-88213',
        'SALES:SL-2024-001',
        'SALES:SL-2024-002',
        'SALES:SL-2024-003',
      ])

      const audit = await app.get(PrismaService).searchAudit.findFirst({ where: { correlationId } })
      expect(audit).toMatchObject({
        vin: VIN,
        salesStatus: 'OK',
        serviceStatus: 'OK',
        documentCount: 6,
      })
    })
  })

  it('returns PARTIAL when the Service system is down', async () => {
    await withApp({ service: deadUrl }, async (app) => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${VIN}/documents`)
        .expect(200)

      expect(response.body.meta).toMatchObject({
        status: 'PARTIAL',
        sources: { SALES: 'OK', SERVICE: 'ERROR' },
      })
      expect(response.body.documents).toHaveLength(3)
    })
  })

  it('rejects a malformed VIN with 400 without calling upstream', async () => {
    await withApp({}, async (app) => {
      const correlationId = randomUUID()

      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles/NOT-A-VIN/documents')
        .set('x-correlation-id', correlationId)
        .expect(400)

      expect(response.body).toMatchObject({ message: 'Validation failed' })
      expect(response.body.errors).toBeInstanceOf(Array)
      expect(response.body.errors[0]).toMatchObject({ path: 'vin' })

      const audit = await app.get(PrismaService).searchAudit.findFirst({ where: { correlationId } })
      expect(audit).toBeNull()
    })
  })

  it('returns 502 when both systems are down, after writing the audit row', async () => {
    await withApp({ sales: deadUrl, service: deadUrl }, async (app) => {
      const correlationId = randomUUID()

      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${VIN}/documents`)
        .set('x-correlation-id', correlationId)
        .expect(502)

      expect(response.body).toMatchObject({
        statusCode: 502,
        message: 'Both document sources are unavailable',
        sources: { SALES: 'ERROR', SERVICE: 'ERROR' },
      })

      const audit = await app.get(PrismaService).searchAudit.findFirst({ where: { correlationId } })
      expect(audit).toMatchObject({
        salesStatus: 'ERROR',
        serviceStatus: 'ERROR',
        documentCount: 0,
      })
    })
  })

  it('accepts a non-UUID correlation id and still writes the audit row', async () => {
    await withApp({}, async (app) => {
      const correlationId = `trace-${randomUUID()}`

      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${VIN}/documents`)
        .set('x-correlation-id', correlationId)
        .expect(200)

      expect(response.headers['x-correlation-id']).toBe(correlationId)

      const audit = await app.get(PrismaService).searchAudit.findFirst({ where: { correlationId } })
      expect(audit).not.toBeNull()
    })
  })

  it('generates a correlation id when the client sends none', async () => {
    await withApp({}, async (app) => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${VIN}/documents`)
        .expect(200)

      const correlationId = response.headers['x-correlation-id'] as string
      expect(correlationId).toMatch(/^[0-9a-f-]{36}$/)

      const audit = await app.get(PrismaService).searchAudit.findFirst({ where: { correlationId } })
      expect(audit).not.toBeNull()
    })
  })
})

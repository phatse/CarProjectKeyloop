import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SalesAdapter } from '../../../../src/documents/adapters/sales.adapter.js'

const createAdapter = async (timeoutMs = 100): Promise<SalesAdapter> => {
  const values = { SALES_API_URL: 'http://sales.test', UPSTREAM_TIMEOUT_MS: timeoutMs }
  const moduleRef = await Test.createTestingModule({
    providers: [
      SalesAdapter,
      {
        provide: ConfigService,
        useValue: { getOrThrow: (key: keyof typeof values) => values[key] },
      },
    ],
  }).compile()

  return moduleRef.get(SalesAdapter)
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const payload = {
  vin: '1HGCM82633A004352',
  documents: [
    {
      id: 'SL-2024-001',
      docType: 'CONTRACT',
      title: 'Vehicle Purchase Agreement',
      signedOn: '2024-03-12',
      amount: '28500.00',
      currency: 'USD',
      fileUrl: 'https://sales.example.com/docs/SL-2024-001.pdf',
    },
  ],
}

describe('SalesAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps the Sales payload into the shared Document shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload))
    vi.stubGlobal('fetch', fetchMock)

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result.status).toBe('OK')
    expect(result.documents).toEqual([
      {
        id: 'SALES:SL-2024-001',
        source: 'SALES',
        type: 'CONTRACT',
        title: 'Vehicle Purchase Agreement',
        issuedAt: '2024-03-12',
        amount: 28500,
        currency: 'USD',
        url: 'https://sales.example.com/docs/SL-2024-001.pdf',
      },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://sales.test/documents?vin=1HGCM82633A004352',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('returns INVALID_PAYLOAD when a document is missing required fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ vin: 'x', documents: [{ id: 'SL-1' }] })),
    )

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result).toMatchObject({ status: 'INVALID_PAYLOAD', documents: [] })
  })

  it('returns ERROR when the upstream responds with a non-2xx status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'down' }, 500)))

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result).toMatchObject({ status: 'ERROR', documents: [] })
  })

  it('returns TIMEOUT when the deadline expires', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
            })
          }),
      ),
    )

    const adapter = await createAdapter(10)
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result).toMatchObject({ status: 'TIMEOUT', documents: [] })
    expect(result.latencyMs).toBeGreaterThanOrEqual(10)
  })

  it('returns ERROR when the connection fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result).toMatchObject({ status: 'ERROR', documents: [] })
  })
})

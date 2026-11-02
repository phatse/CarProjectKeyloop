import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServiceAdapter } from '../../../../src/documents/adapters/service.adapter.js'

const createAdapter = async (): Promise<ServiceAdapter> => {
  const values = { SERVICE_API_URL: 'http://service.test', UPSTREAM_TIMEOUT_MS: 100 }
  const moduleRef = await Test.createTestingModule({
    providers: [
      ServiceAdapter,
      {
        provide: ConfigService,
        useValue: { getOrThrow: (key: keyof typeof values) => values[key] },
      },
    ],
  }).compile()

  return moduleRef.get(ServiceAdapter)
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

describe('ServiceAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps the Service payload into the shared Document shape', async () => {
    const payload = {
      vehicle: '1HGCM82633A004352',
      items: [
        {
          ref: 'SVC-88213',
          kind: 'SERVICE_ORDER',
          name: '10,000 km Service',
          date: '2024-08-20',
          total: '340.00',
          link: 'https://service.example.com/o/88213',
        },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)))

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result.status).toBe('OK')
    expect(result.documents).toEqual([
      {
        id: 'SERVICE:SVC-88213',
        source: 'SERVICE',
        type: 'SERVICE_ORDER',
        title: '10,000 km Service',
        issuedAt: '2024-08-20',
        amount: 340,
        currency: null,
        url: 'https://service.example.com/o/88213',
      },
    ])
  })

  it('returns INVALID_PAYLOAD when the envelope is wrong', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ documents: [] })))

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result).toMatchObject({ status: 'INVALID_PAYLOAD', documents: [] })
  })

  it('returns ERROR on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'down' }, 503)))

    const adapter = await createAdapter()
    const result = await adapter.fetch('1HGCM82633A004352')

    expect(result).toMatchObject({ status: 'ERROR', documents: [] })
  })
})

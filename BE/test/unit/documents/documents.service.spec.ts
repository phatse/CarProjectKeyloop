import { BadGatewayException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PinoLogger } from 'nestjs-pino'
import { describe, expect, it, vi } from 'vitest'
import type {
  DocumentSource,
  SourceResult,
} from '../../../src/documents/adapters/document-source.types.js'
import { SalesAdapter } from '../../../src/documents/adapters/sales.adapter.js'
import { ServiceAdapter } from '../../../src/documents/adapters/service.adapter.js'
import { DocumentsService } from '../../../src/documents/documents.service.js'
import type { Document, DocumentSourceName } from '../../../src/documents/dto/document.schema.js'
import { SearchAuditRepository } from '../../../src/documents/search-audit.repository.js'

const VIN = '1HGCM82633A004352'
const CORRELATION_ID = '9b2f6f0e-0f6b-4a1e-9d3a-2f7c1b5e8a11'

const documentFixture = (id: string, issuedAt: string): Document => ({
  id,
  source: id.startsWith('SALES:') ? 'SALES' : 'SERVICE',
  type: 'CONTRACT',
  title: id,
  issuedAt,
  amount: null,
  currency: null,
  url: null,
})

const source = (
  name: DocumentSourceName,
  result: Partial<Omit<SourceResult, 'source'>> = {},
  delayMs = 0,
): DocumentSource => ({
  name,
  fetch: vi.fn(async (): Promise<SourceResult> => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    return { source: name, status: 'OK', documents: [], latencyMs: 5, ...result }
  }),
})

type AuditMock = { record: ReturnType<typeof vi.fn> }

const auditRepository = (): AuditMock => ({ record: vi.fn().mockResolvedValue(undefined) })

// Same wiring as DocumentsModule, with every dependency replaced by a mock.
const createService = async (
  sales: DocumentSource,
  service: DocumentSource,
  audit: AuditMock = auditRepository(),
): Promise<DocumentsService> => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      DocumentsService,
      { provide: SalesAdapter, useValue: sales },
      { provide: ServiceAdapter, useValue: service },
      { provide: SearchAuditRepository, useValue: audit },
      { provide: PinoLogger, useValue: { warn: vi.fn() } },
    ],
  }).compile()

  return moduleRef.get(DocumentsService)
}

describe('DocumentsService', () => {
  it('returns COMPLETE and merges both sources when both answer', async () => {
    const service = await createService(
      source('SALES', { documents: [documentFixture('SALES:SL-1', '2024-03-12')] }),
      source('SERVICE', { documents: [documentFixture('SERVICE:SVC-1', '2024-08-20')] }),
    )

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.meta.status).toBe('COMPLETE')
    expect(response.meta.sources).toEqual({ SALES: 'OK', SERVICE: 'OK' })
    expect(response.documents.map((document) => document.id)).toEqual([
      'SERVICE:SVC-1',
      'SALES:SL-1',
    ])
  })

  it('returns PARTIAL when one source fails', async () => {
    const service = await createService(
      source('SALES', { documents: [documentFixture('SALES:SL-1', '2024-03-12')] }),
      source('SERVICE', { status: 'ERROR' }),
    )

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.meta.status).toBe('PARTIAL')
    expect(response.meta.sources).toEqual({ SALES: 'OK', SERVICE: 'ERROR' })
    expect(response.documents).toHaveLength(1)
  })

  it('returns PARTIAL when one source times out', async () => {
    const service = await createService(
      source('SALES', { status: 'TIMEOUT' }),
      source('SERVICE', { documents: [documentFixture('SERVICE:SVC-1', '2024-08-20')] }),
    )

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.meta.status).toBe('PARTIAL')
    expect(response.meta.sources).toEqual({ SALES: 'TIMEOUT', SERVICE: 'OK' })
  })

  it('throws 502 when both sources fail, after writing the audit row', async () => {
    const audit = auditRepository()
    const service = await createService(
      source('SALES', { status: 'ERROR' }),
      source('SERVICE', { status: 'TIMEOUT' }),
      audit,
    )

    const error = await service.search(VIN, CORRELATION_ID).catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(BadGatewayException)
    expect((error as BadGatewayException).getResponse()).toMatchObject({
      statusCode: 502,
      sources: { SALES: 'ERROR', SERVICE: 'TIMEOUT' },
    })
    expect(audit.record).toHaveBeenCalledTimes(1)
  })

  it('dedupes documents by id, which is (source, externalId)', async () => {
    const duplicate = documentFixture('SALES:SL-1', '2024-03-12')
    const service = await createService(
      source('SALES', { documents: [duplicate, duplicate] }),
      source('SERVICE'),
    )

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.documents).toHaveLength(1)
  })

  it('returns COMPLETE with an empty list when nobody has documents', async () => {
    const service = await createService(source('SALES'), source('SERVICE'))

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.meta.status).toBe('COMPLETE')
    expect(response.documents).toEqual([])
  })

  it('sorts by issuedAt descending, then by id ascending', async () => {
    const service = await createService(
      source('SALES', {
        documents: [
          documentFixture('SALES:old', '2024-01-01'),
          documentFixture('SALES:tie', '2024-03-01'),
        ],
      }),
      source('SERVICE', {
        documents: [
          documentFixture('SERVICE:tie', '2024-03-01'),
          documentFixture('SERVICE:mid', '2024-02-01'),
        ],
      }),
    )

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.documents.map((document) => document.id)).toEqual([
      'SALES:tie',
      'SERVICE:tie',
      'SERVICE:mid',
      'SALES:old',
    ])
  })

  it('calls both sources in parallel', async () => {
    const service = await createService(
      source('SALES', { documents: [documentFixture('SALES:SL-1', '2024-03-12')] }, 100),
      source('SERVICE', { documents: [documentFixture('SERVICE:SVC-1', '2024-08-20')] }, 100),
    )

    const startedAt = Date.now()
    await service.search(VIN, CORRELATION_ID)
    const elapsed = Date.now() - startedAt

    // Sequential would be ~200 ms; parallel must stay close to one call.
    expect(elapsed).toBeLessThan(180)
  })

  it('still returns data when the audit write fails', async () => {
    const audit = { record: vi.fn().mockRejectedValue(new Error('db down')) }
    const service = await createService(
      source('SALES', { documents: [documentFixture('SALES:SL-1', '2024-03-12')] }),
      source('SERVICE'),
      audit,
    )

    const response = await service.search(VIN, CORRELATION_ID)

    expect(response.meta.status).toBe('COMPLETE')
    expect(response.documents).toHaveLength(1)
  })

  it('writes one audit row with statuses, latencies and document count', async () => {
    const audit = auditRepository()
    const service = await createService(
      source('SALES', { documents: [documentFixture('SALES:SL-1', '2024-03-12')] }),
      source('SERVICE', { status: 'TIMEOUT' }),
      audit,
    )

    await service.search(VIN, CORRELATION_ID)

    expect(audit.record).toHaveBeenCalledWith({
      correlationId: CORRELATION_ID,
      vin: VIN,
      sources: { SALES: 'OK', SERVICE: 'TIMEOUT' },
      latencies: { SALES: 5, SERVICE: 5 },
      documentCount: 1,
    })
  })
})

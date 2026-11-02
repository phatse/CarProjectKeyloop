import { BadGatewayException, Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import type { DocumentSource, SourceResult } from './adapters/document-source.types.js'
import { SalesAdapter } from './adapters/sales.adapter.js'
import { ServiceAdapter } from './adapters/service.adapter.js'
import type { Document, DocumentSourceName } from './dto/document.schema.js'
import type { DocumentsResponse, SourceStatus } from './dto/response.schema.js'
import { type SearchAuditEntry, SearchAuditRepository } from './search-audit.repository.js'

@Injectable()
export class DocumentsService {
  private readonly sales: DocumentSource
  private readonly service: DocumentSource
  private readonly audit: SearchAuditRepository
  private readonly logger: PinoLogger

  constructor(
    sales: SalesAdapter,
    service: ServiceAdapter,
    audit: SearchAuditRepository,
    logger: PinoLogger,
  ) {
    this.sales = sales
    this.service = service
    this.audit = audit
    this.logger = logger
  }

  async search(vin: string, correlationId: string): Promise<DocumentsResponse> {
    const startedAt = Date.now()
    const [salesResult, serviceResult] = await this.fetchBoth(vin)

    const sources = { SALES: salesResult.status, SERVICE: serviceResult.status }
    const documents = mergeDocuments([salesResult, serviceResult])
    const okCount = countOk(sources)

    await this.recordAudit({
      correlationId,
      vin,
      sources,
      latencies: { SALES: salesResult.latencyMs, SERVICE: serviceResult.latencyMs },
      documentCount: documents.length,
    })

    if (okCount === 0) {
      throw new BadGatewayException({
        statusCode: 502,
        message: 'Both document sources are unavailable',
        sources,
      })
    }

    return {
      vin,
      documents,
      meta: {
        status: okCount === 2 ? 'COMPLETE' : 'PARTIAL',
        sources,
        durationMs: Date.now() - startedAt,
      },
    }
  }

  // allSettled on purpose: one adapter rejecting must not cancel the other.
  private async fetchBoth(vin: string): Promise<[SourceResult, SourceResult]> {
    const [sales, service] = await Promise.allSettled([
      this.sales.fetch(vin),
      this.service.fetch(vin),
    ])

    return [
      sales.status === 'fulfilled' ? sales.value : failedResult('SALES'),
      service.status === 'fulfilled' ? service.value : failedResult('SERVICE'),
    ]
  }

  private async recordAudit(entry: SearchAuditEntry): Promise<void> {
    try {
      await this.audit.record(entry)
    } catch (error) {
      // Audit is evidence, not a dependency of the response.
      this.logger.warn({ err: error, vin: entry.vin }, 'search audit write failed')
    }
  }
}

const failedResult = (source: DocumentSourceName): SourceResult => ({
  source,
  status: 'ERROR',
  documents: [],
  latencyMs: 0,
})

const countOk = (sources: Record<DocumentSourceName, SourceStatus>): number =>
  [sources.SALES, sources.SERVICE].filter((status) => status === 'OK').length

const mergeDocuments = (results: SourceResult[]): Document[] => {
  const byId = new Map<string, Document>()

  for (const result of results) {
    for (const document of result.documents) {
      // id is "SOURCE:externalId", so this dedupes by (source, externalId).
      byId.set(document.id, document)
    }
  }

  return [...byId.values()].sort(compareDocuments)
}

const compareDocuments = (left: Document, right: Document): number => {
  if (left.issuedAt !== right.issuedAt) {
    return left.issuedAt < right.issuedAt ? 1 : -1
  }

  return left.id.localeCompare(right.id)
}

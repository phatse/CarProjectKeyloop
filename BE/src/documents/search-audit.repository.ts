import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import type { DocumentSourceName } from './dto/document.schema.js'
import type { SourceStatus } from './dto/response.schema.js'

export type SearchAuditEntry = {
  correlationId: string
  vin: string
  sources: Record<DocumentSourceName, SourceStatus>
  latencies: Record<DocumentSourceName, number>
  documentCount: number
}

@Injectable()
export class SearchAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: SearchAuditEntry): Promise<void> {
    await this.prisma.searchAudit.create({
      data: {
        correlationId: entry.correlationId,
        vin: entry.vin,
        salesStatus: entry.sources.SALES,
        serviceStatus: entry.sources.SERVICE,
        salesLatencyMs: entry.latencies.SALES,
        serviceLatencyMs: entry.latencies.SERVICE,
        documentCount: entry.documentCount,
      },
    })
  }
}

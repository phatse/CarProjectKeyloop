import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'
import type { Env } from '../../config/env.js'
import type { Document } from '../dto/document.schema.js'
import type { DocumentSource, SourceResult } from './document-source.types.js'
import { fetchUpstream } from './upstream-client.js'

// Sales uses its own field names; normalising them is this adapter's job.
const salesPayloadSchema = z.object({
  vin: z.string(),
  documents: z.array(
    z.object({
      id: z.string().min(1),
      docType: z.string().min(1),
      title: z.string().min(1),
      signedOn: z.iso.date(),
      amount: z.string().nullable(),
      currency: z.string().nullable(),
      fileUrl: z.url().nullable(),
    }),
  ),
})

type SalesDocument = z.infer<typeof salesPayloadSchema>['documents'][number]

const toDocument = (row: SalesDocument): Document => ({
  id: `SALES:${row.id}`,
  source: 'SALES',
  type: row.docType,
  title: row.title,
  issuedAt: row.signedOn,
  amount: row.amount === null ? null : Number(row.amount),
  currency: row.currency,
  url: row.fileUrl,
})

@Injectable()
export class SalesAdapter implements DocumentSource {
  readonly name = 'SALES' as const

  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(config: ConfigService<Env, true>) {
    this.baseUrl = config.getOrThrow('SALES_API_URL')
    this.timeoutMs = config.getOrThrow('UPSTREAM_TIMEOUT_MS')
  }

  async fetch(vin: string): Promise<SourceResult> {
    const startedAt = Date.now()
    const url = `${this.baseUrl}/documents?vin=${encodeURIComponent(vin)}`
    const outcome = await fetchUpstream(url, this.timeoutMs)
    const latencyMs = Date.now() - startedAt

    if (!outcome.ok) {
      return { source: this.name, status: outcome.status, documents: [], latencyMs }
    }

    const parsed = salesPayloadSchema.safeParse(outcome.body)
    if (!parsed.success) {
      return { source: this.name, status: 'INVALID_PAYLOAD', documents: [], latencyMs }
    }

    return {
      source: this.name,
      status: 'OK',
      documents: parsed.data.documents.map(toDocument),
      latencyMs,
    }
  }
}

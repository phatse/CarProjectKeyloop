import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'
import type { Env } from '../../config/env.js'
import type { Document } from '../dto/document.schema.js'
import type { DocumentSource, SourceResult } from './document-source.types.js'
import { fetchUpstream } from './upstream-client.js'

// Service returns a different envelope and different field names than Sales.
const servicePayloadSchema = z.object({
  vehicle: z.string(),
  items: z.array(
    z.object({
      ref: z.string().min(1),
      kind: z.string().min(1),
      name: z.string().min(1),
      date: z.iso.date(),
      total: z.string().nullable(),
      link: z.url().nullable(),
    }),
  ),
})

type ServiceDocument = z.infer<typeof servicePayloadSchema>['items'][number]

const toDocument = (row: ServiceDocument): Document => ({
  id: `SERVICE:${row.ref}`,
  source: 'SERVICE',
  type: row.kind,
  title: row.name,
  issuedAt: row.date,
  amount: row.total === null ? null : Number(row.total),
  currency: null,
  url: row.link,
})

@Injectable()
export class ServiceAdapter implements DocumentSource {
  readonly name = 'SERVICE' as const

  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(config: ConfigService<Env, true>) {
    this.baseUrl = config.getOrThrow('SERVICE_API_URL')
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

    const parsed = servicePayloadSchema.safeParse(outcome.body)
    if (!parsed.success) {
      return { source: this.name, status: 'INVALID_PAYLOAD', documents: [], latencyMs }
    }

    return {
      source: this.name,
      status: 'OK',
      documents: parsed.data.items.map(toDocument),
      latencyMs,
    }
  }
}

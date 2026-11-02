import type { Document, DocumentSourceName } from '../dto/document.schema.js'
import type { SourceStatus } from '../dto/response.schema.js'

export type SourceResult = {
  source: DocumentSourceName
  status: SourceStatus
  documents: Document[]
  latencyMs: number
}

// Adapters never throw for upstream problems: a dead, slow or malformed source
// is data in `SourceResult`, not an exception. Throwing is reserved for
// programmer errors.
export type DocumentSource = {
  readonly name: DocumentSourceName
  fetch(vin: string): Promise<SourceResult>
}

export type DocumentSource = 'SALES' | 'SERVICE'

export type SourceStatus = 'OK' | 'TIMEOUT' | 'ERROR' | 'INVALID_PAYLOAD'

export type SearchStatus = 'COMPLETE' | 'PARTIAL'

// Mirrors Docs/contracts/documents-api.md. The backend owns this shape;
// these types only describe what the frontend reads.
export type Document = {
  id: string
  source: DocumentSource
  type: string
  title: string
  issuedAt: string
  amount: number | null
  currency: string | null
  url: string | null
}

export type DocumentsResponse = {
  vin: string
  documents: Document[]
  meta: {
    status: SearchStatus
    sources: Record<DocumentSource, SourceStatus>
    durationMs: number
  }
}

import { z } from 'zod'
import { documentSchema } from './document.schema.js'

export const sourceStatusSchema = z.enum(['OK', 'TIMEOUT', 'ERROR', 'INVALID_PAYLOAD'])

export const searchStatusSchema = z.enum(['COMPLETE', 'PARTIAL'])

export const documentsResponseSchema = z.object({
  vin: z.string(),
  documents: z.array(documentSchema),
  meta: z.object({
    status: searchStatusSchema,
    sources: z.object({
      SALES: sourceStatusSchema,
      SERVICE: sourceStatusSchema,
    }),
    durationMs: z.number().int().nonnegative(),
  }),
})

export type SourceStatus = z.infer<typeof sourceStatusSchema>
export type SearchStatus = z.infer<typeof searchStatusSchema>
export type DocumentsResponse = z.infer<typeof documentsResponseSchema>

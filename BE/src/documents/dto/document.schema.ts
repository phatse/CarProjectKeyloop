import { z } from 'zod'

export const documentSourceSchema = z.enum(['SALES', 'SERVICE'])

// The single shape returned to the frontend, after both upstream payloads have
// been normalised. `id` is prefixed with the source, so it is also the dedupe
// key for (source, externalId).
export const documentSchema = z.object({
  id: z.string().min(1),
  source: documentSourceSchema,
  type: z.string().min(1),
  title: z.string().min(1),
  issuedAt: z.iso.date(),
  amount: z.number().nullable(),
  currency: z.string().length(3).nullable(),
  url: z.url().nullable(),
})

export type Document = z.infer<typeof documentSchema>
export type DocumentSourceName = z.infer<typeof documentSourceSchema>

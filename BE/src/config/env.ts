import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
      message: 'must be a PostgreSQL connection string (postgresql://...)',
    }),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Upstream systems. Defaults match the local mock processes in Phase 2.
  SALES_API_URL: z.url().default('http://localhost:4001'),
  SERVICE_API_URL: z.url().default('http://localhost:4002'),
  // Deadline per upstream call, in milliseconds (RFC-0001 assumption 3).
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(1500),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')

    throw new Error(`Invalid environment configuration:\n${details}`)
  }

  return result.data
}

import { describe, expect, it } from 'vitest'
import { validateEnv } from './env.js'

const validUrl = 'postgresql://carproject:carproject@localhost:5432/carproject?schema=public'

describe('validateEnv', () => {
  it('coerces PORT and applies defaults', () => {
    const env = validateEnv({ DATABASE_URL: validUrl, PORT: '4000' })

    expect(env.PORT).toBe(4000)
    expect(env.NODE_ENV).toBe('development')
    expect(env.LOG_LEVEL).toBe('info')
    expect(env.CORS_ORIGIN).toBe('http://localhost:5173')
  })

  it('fails fast when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/)
  })

  it('rejects a non-postgres connection string', () => {
    expect(() => validateEnv({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(/DATABASE_URL/)
  })

  it('rejects an out-of-range port', () => {
    expect(() => validateEnv({ DATABASE_URL: validUrl, PORT: '70000' })).toThrow(/PORT/)
  })
})

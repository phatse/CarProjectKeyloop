import { describe, expect, it } from 'vitest'
import { vinSchema } from '../../../../src/documents/dto/vin.schema.js'

describe('vinSchema', () => {
  it('accepts a valid 17-character VIN', () => {
    expect(vinSchema.parse('1HGCM82633A004352')).toBe('1HGCM82633A004352')
  })

  it('trims whitespace and upper-cases the input', () => {
    expect(vinSchema.parse('  1hgcm82633a004352  ')).toBe('1HGCM82633A004352')
  })

  it('rejects a VIN shorter than 17 characters', () => {
    expect(vinSchema.safeParse('1HGCM82633A00435').success).toBe(false)
  })

  it('rejects a VIN longer than 17 characters', () => {
    expect(vinSchema.safeParse('1HGCM82633A0043520').success).toBe(false)
  })

  it('rejects the letters I, O and Q', () => {
    expect(vinSchema.safeParse('1HGCM82633A00435I').success).toBe(false)
    expect(vinSchema.safeParse('1HGCM82633A00435O').success).toBe(false)
    expect(vinSchema.safeParse('1HGCM82633A00435Q').success).toBe(false)
  })

  it('rejects symbols and spaces inside the VIN', () => {
    expect(vinSchema.safeParse('1HGCM82633A00435-').success).toBe(false)
    expect(vinSchema.safeParse('1HGCM 2633A004352').success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(vinSchema.safeParse('').success).toBe(false)
  })
})

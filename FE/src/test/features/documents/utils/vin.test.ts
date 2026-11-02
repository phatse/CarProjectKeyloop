import { describe, expect, it } from 'vitest'
import { isValidVin, normalizeVin } from '@/features/documents/utils/vin'

describe('normalizeVin', () => {
  it('trims surrounding whitespace and upper-cases the value', () => {
    expect(normalizeVin('  1hgcm82633a004352  ')).toBe('1HGCM82633A004352')
  })
})

describe('isValidVin', () => {
  it('accepts a 17-character VIN', () => {
    expect(isValidVin('1HGCM82633A004352')).toBe(true)
  })

  it('rejects a VIN shorter than 17 characters', () => {
    expect(isValidVin('1HGCM82633A00435')).toBe(false)
  })

  it('rejects a VIN longer than 17 characters', () => {
    expect(isValidVin('1HGCM82633A0043520')).toBe(false)
  })

  it('rejects the letters I, O and Q', () => {
    expect(isValidVin('1HGCM82633A00435I')).toBe(false)
    expect(isValidVin('1HGCM82633A00435O')).toBe(false)
    expect(isValidVin('1HGCM82633A00435Q')).toBe(false)
  })

  it('rejects symbols', () => {
    expect(isValidVin('1HGCM82633A00435-')).toBe(false)
  })
})

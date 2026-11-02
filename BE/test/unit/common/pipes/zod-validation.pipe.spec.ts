import { type ArgumentMetadata, BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ZodValidationPipe } from '../../../../src/common/pipes/zod-validation.pipe.js'
import { vinSchema } from '../../../../src/documents/dto/vin.schema.js'

const paramMetadata = (data: string): ArgumentMetadata => ({
  type: 'param',
  data,
  metatype: String,
})

describe('ZodValidationPipe', () => {
  it('returns the parsed and transformed value', () => {
    const pipe = new ZodValidationPipe(vinSchema)

    expect(pipe.transform(' 1hgcm82633a004352 ', paramMetadata('vin'))).toBe('1HGCM82633A004352')
  })

  it('names the failing parameter when the schema has no path', () => {
    const pipe = new ZodValidationPipe(vinSchema)

    let error: unknown
    try {
      pipe.transform('short', paramMetadata('vin'))
    } catch (cause) {
      error = cause
    }

    expect(error).toBeInstanceOf(BadRequestException)
    expect((error as BadRequestException).getResponse()).toMatchObject({
      message: 'Validation failed',
      errors: [{ path: 'vin' }],
    })
  })

  it('keeps the field path for object schemas', () => {
    const pipe = new ZodValidationPipe(z.object({ vin: vinSchema }))

    let error: unknown
    try {
      pipe.transform({ vin: 'short' }, paramMetadata('body'))
    } catch (cause) {
      error = cause
    }

    expect((error as BadRequestException).getResponse()).toMatchObject({
      errors: [{ path: 'vin' }],
    })
  })
})

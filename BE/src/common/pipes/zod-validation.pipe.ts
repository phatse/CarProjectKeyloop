import { type ArgumentMetadata, BadRequestException, type PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'

type FieldError = {
  path: string
  message: string
}

// Instantiated per parameter (`new ZodValidationPipe(schema)`), not by Nest DI:
// the schema is a constructor argument, so there is nothing for the container
// to resolve.
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value)

    if (!result.success) {
      const errors: FieldError[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.') || metadata.data || '(root)',
        message: issue.message,
      }))

      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      })
    }

    return result.data
  }
}

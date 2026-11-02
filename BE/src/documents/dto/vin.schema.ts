import { z } from 'zod'

// ISO 3779: 17 characters, excluding I, O and Q because they are easily
// confused with 1 and 0. Input is trimmed and upper-cased before validation.
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/

export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(VIN_PATTERN, 'VIN must be 17 characters from A-Z and 0-9, excluding I, O and Q')

export type Vin = z.infer<typeof vinSchema>

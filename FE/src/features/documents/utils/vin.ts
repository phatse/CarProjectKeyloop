// ISO 3779: 17 characters, excluding I, O and Q. Mirrors the backend rule in
// BE/src/documents/dto/vin.schema.ts; the two cannot share a module because
// FE and BE are separate packages. The contract is Docs/contracts/documents-api.md.
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/

export const normalizeVin = (value: string): string => value.trim().toUpperCase()

export const isValidVin = (value: string): boolean => VIN_PATTERN.test(normalizeVin(value))

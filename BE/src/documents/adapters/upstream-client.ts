import type { SourceStatus } from '../dto/response.schema.js'

export type UpstreamOutcome =
  | { ok: true; body: unknown }
  | { ok: false; status: Exclude<SourceStatus, 'OK'> }

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')

// Transport only: deadline, non-2xx classification and JSON decoding. Payload
// parsing belongs to each adapter, because the two systems disagree on shape.
export async function fetchUpstream(url: string, timeoutMs: number): Promise<UpstreamOutcome> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })

    if (!response.ok) {
      return { ok: false, status: 'ERROR' }
    }

    try {
      return { ok: true, body: await response.json() }
    } catch {
      return { ok: false, status: 'INVALID_PAYLOAD' }
    }
  } catch (error) {
    return { ok: false, status: isTimeout(error) ? 'TIMEOUT' : 'ERROR' }
  }
}

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DegradedBanner } from '@/features/documents/components/DegradedBanner'

describe('DegradedBanner', () => {
  it('names the source that failed and why', () => {
    render(<DegradedBanner sources={{ SALES: 'OK', SERVICE: 'TIMEOUT' }} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Service')
    expect(screen.getByRole('alert')).toHaveTextContent('timed out')
  })

  it('reports a source that returned an error', () => {
    render(<DegradedBanner sources={{ SALES: 'ERROR', SERVICE: 'OK' }} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Sales')
    expect(screen.getByRole('alert')).toHaveTextContent('unavailable')
  })
})

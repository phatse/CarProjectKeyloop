import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SourceTag } from '@/features/documents/components/SourceTag'

describe('SourceTag', () => {
  it('labels a sales document', () => {
    render(<SourceTag source="SALES" />)

    expect(screen.getByText('Sales')).toBeInTheDocument()
  })

  it('labels a service document', () => {
    render(<SourceTag source="SERVICE" />)

    expect(screen.getByText('Service')).toBeInTheDocument()
  })
})

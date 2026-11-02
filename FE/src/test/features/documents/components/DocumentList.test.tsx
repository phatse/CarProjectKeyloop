import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DocumentList } from '@/features/documents/components/DocumentList'
import type { Document } from '@/features/documents/types/document'

const documents: Document[] = [
  {
    id: 'SALES:SL-2024-001',
    source: 'SALES',
    type: 'CONTRACT',
    title: 'Vehicle Purchase Agreement',
    issuedAt: '2024-03-12',
    amount: 28500,
    currency: 'USD',
    url: 'https://sales.example.com/docs/SL-2024-001.pdf',
  },
  {
    id: 'SERVICE:SVC-88213',
    source: 'SERVICE',
    type: 'SERVICE_ORDER',
    title: '10,000 km Service',
    issuedAt: '2024-08-20',
    amount: null,
    currency: null,
    url: null,
  },
]

describe('DocumentList', () => {
  it('renders one row per document with its source and date', () => {
    render(<DocumentList documents={documents} />)

    expect(screen.getByText('Vehicle Purchase Agreement')).toBeInTheDocument()
    expect(screen.getByText('10,000 km Service')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText(/2024-03-12/)).toBeInTheDocument()
  })

  it('omits the amount when the document has none', () => {
    render(<DocumentList documents={documents} />)

    expect(screen.getByText(/USD 28,500\.00/)).toBeInTheDocument()
    expect(screen.queryByText(/SVC-88213/)).not.toBeInTheDocument()
  })
})

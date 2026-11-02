import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VinSearchForm } from '@/features/documents/components/VinSearchForm'

const VIN_HINT = 'Enter a 17-character VIN (letters I, O and Q are not used)'

describe('VinSearchForm', () => {
  it('submits the normalised VIN', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()

    render(<VinSearchForm onSearch={onSearch} />)
    await user.type(screen.getByLabelText('VIN'), '  1hgcm82633a004352  ')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSearch).toHaveBeenCalledWith('1HGCM82633A004352')
  })

  it('blocks a malformed VIN and does not search', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()

    render(<VinSearchForm onSearch={onSearch} />)
    await user.type(screen.getByLabelText('VIN'), 'NOT-A-VIN')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSearch).not.toHaveBeenCalled()
    expect(await screen.findByText(VIN_HINT)).toBeInTheDocument()
  })

  it('blocks an empty submission', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()

    render(<VinSearchForm onSearch={onSearch} />)
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onSearch).not.toHaveBeenCalled()
    expect(await screen.findAllByText(VIN_HINT)).toHaveLength(1)
  })

  it('shows the format error once, never twice', async () => {
    const user = userEvent.setup()

    render(<VinSearchForm onSearch={vi.fn()} />)
    await user.type(screen.getByLabelText('VIN'), '1HGCM82633A00435')

    expect(await screen.findAllByText(VIN_HINT)).toHaveLength(1)
  })

  it('shows a single error after the field is cleared', async () => {
    const user = userEvent.setup()

    render(<VinSearchForm onSearch={vi.fn()} />)
    const input = screen.getByLabelText('VIN')
    await user.type(input, '1')
    await user.clear(input)

    expect(await screen.findAllByText(VIN_HINT)).toHaveLength(1)
  })
})

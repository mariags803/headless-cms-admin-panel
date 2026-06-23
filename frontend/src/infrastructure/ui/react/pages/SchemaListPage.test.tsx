import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Schema } from '@cms/shared'
import type { UseCases } from '../providers/UseCasesProvider'
import { makeWrapper } from '../hooks/test-helpers/renderWithProviders'
import { SchemaListPage } from './SchemaListPage'

function fakeUseCases(overrides: Partial<UseCases> = {}): UseCases {
  return {
    listSchemas: { execute: jest.fn().mockResolvedValue([]) } as never,
    getSchema: {} as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: { execute: jest.fn().mockResolvedValue(undefined) } as never,
    listEntries: {} as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: {} as never,
    ...overrides,
  }
}

function renderPage(useCases: UseCases) {
  const { Wrapper } = makeWrapper(useCases)
  return render(
    <Wrapper>
      <MemoryRouter>
        <SchemaListPage />
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('SchemaListPage', () => {
  it('shows a loading state before schemas resolve', () => {
    const useCases = fakeUseCases({
      listSchemas: { execute: jest.fn(() => new Promise(() => {})) } as never,
    })

    renderPage(useCases)

    expect(screen.getByText(/loading content types/i)).toBeInTheDocument()
  })

  it('renders each schema with its field count', async () => {
    const schemas: Schema[] = [
      { id: 's1', name: 'Car', fields: [{ id: 'f1', name: 'brand', type: 'text', required: true }], createdAt: '', updatedAt: '' },
      { id: 's2', name: 'Person', fields: [], createdAt: '', updatedAt: '' },
    ]
    const useCases = fakeUseCases({
      listSchemas: { execute: jest.fn().mockResolvedValue(schemas) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByText('Car')).toBeInTheDocument()
    expect(screen.getByText('1 fields')).toBeInTheDocument()
    expect(screen.getByText('Person')).toBeInTheDocument()
    expect(screen.getByText('0 fields')).toBeInTheDocument()
  })

  it('shows an empty state when there are no schemas', async () => {
    const useCases = fakeUseCases()

    renderPage(useCases)

    expect(await screen.findByText(/no content types yet/i)).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    const useCases = fakeUseCases({
      listSchemas: { execute: jest.fn().mockRejectedValue(new Error('network down')) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
  })

  it('links "New Content Type" to /schemas/new', async () => {
    const useCases = fakeUseCases()

    renderPage(useCases)

    expect(await screen.findByRole('link', { name: /new content type/i })).toHaveAttribute(
      'href',
      '/schemas/new',
    )
  })

  it('links a schema card\'s Edit action to /schemas/:id/edit', async () => {
    const schemas: Schema[] = [{ id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' }]
    const useCases = fakeUseCases({
      listSchemas: { execute: jest.fn().mockResolvedValue(schemas) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/schemas/s1/edit',
    )
  })

  it('deletes a schema after confirming', async () => {
    const schemas: Schema[] = [{ id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' }]
    const useCases = fakeUseCases({
      listSchemas: { execute: jest.fn().mockResolvedValue(schemas) } as never,
    })
    jest.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage(useCases)
    await screen.findByText('Car')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(useCases.deleteSchema.execute).toHaveBeenCalledWith('s1'))
  })

  it('does not delete when confirmation is declined', async () => {
    const schemas: Schema[] = [{ id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' }]
    const useCases = fakeUseCases({
      listSchemas: { execute: jest.fn().mockResolvedValue(schemas) } as never,
    })
    jest.spyOn(window, 'confirm').mockReturnValue(false)

    renderPage(useCases)
    await screen.findByText('Car')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(useCases.deleteSchema.execute).not.toHaveBeenCalled()
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Entry, Schema } from '@cms/shared'
import type { UseCases } from '../providers/UseCasesProvider'
import { makeWrapper } from '../hooks/test-helpers/renderWithProviders'
import { EntryListPage } from './EntryListPage'

function fakeUseCases(overrides: Partial<UseCases> = {}): UseCases {
  return {
    listSchemas: {} as never,
    getSchema: { execute: jest.fn().mockResolvedValue(undefined) } as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: {} as never,
    listEntries: { execute: jest.fn().mockResolvedValue([]) } as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: { execute: jest.fn().mockResolvedValue(undefined) } as never,
    ...overrides,
  }
}

function renderPage(useCases: UseCases) {
  const { Wrapper } = makeWrapper(useCases)
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/schemas/s1/entries']}>
        <Routes>
          <Route path="/schemas/:schemaId/entries" element={<EntryListPage />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  )
}

const schema: Schema = {
  id: 's1',
  name: 'Car',
  fields: [
    { id: 'f1', name: 'brand', type: 'text', required: true },
    { id: 'f2', name: 'available', type: 'boolean', required: false },
  ],
  createdAt: '',
  updatedAt: '',
}

describe('EntryListPage', () => {
  it('shows a loading state before entries resolve', () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn(() => new Promise(() => {})) } as never,
      listEntries: { execute: jest.fn(() => new Promise(() => {})) } as never,
    })

    renderPage(useCases)

    expect(screen.getByText(/loading entries/i)).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
      listEntries: { execute: jest.fn().mockRejectedValue(new Error('network down')) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
  })

  it('shows an empty state when there are no entries', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([]) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('renders columns from schema fields and cells keyed by field.id', async () => {
    const entries: Entry[] = [
      { id: 'e1', schemaId: 's1', data: { f1: 'Tesla', f2: true }, createdAt: '', updatedAt: '' },
      { id: 'e2', schemaId: 's1', data: { f1: 'Ford', f2: null }, createdAt: '', updatedAt: '' },
    ]
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue(entries) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByRole('columnheader', { name: 'brand' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'available' })).toBeInTheDocument()
    expect(screen.getByText('Tesla')).toBeInTheDocument()
    expect(screen.getByText('Sí')).toBeInTheDocument()
    expect(screen.getByText('Ford')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('links "New Entry" to /schemas/:schemaId/entries/new', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByRole('link', { name: /new entry/i })).toHaveAttribute(
      'href',
      '/schemas/s1/entries/new',
    )
  })

  it('links a row\'s Edit action to /schemas/:schemaId/entries/:id/edit', async () => {
    const entries: Entry[] = [
      { id: 'e1', schemaId: 's1', data: { f1: 'Tesla', f2: true }, createdAt: '', updatedAt: '' },
    ]
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue(entries) } as never,
    })

    renderPage(useCases)

    expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/schemas/s1/entries/e1/edit',
    )
  })

  it('deletes an entry after confirming', async () => {
    const entries: Entry[] = [
      { id: 'e1', schemaId: 's1', data: { f1: 'Tesla', f2: true }, createdAt: '', updatedAt: '' },
    ]
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue(entries) } as never,
    })
    jest.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage(useCases)
    await screen.findByText('Tesla')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(useCases.deleteEntry.execute).toHaveBeenCalledWith('e1'))
  })

  it('does not delete when confirmation is declined', async () => {
    const entries: Entry[] = [
      { id: 'e1', schemaId: 's1', data: { f1: 'Tesla', f2: true }, createdAt: '', updatedAt: '' },
    ]
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(schema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue(entries) } as never,
    })
    jest.spyOn(window, 'confirm').mockReturnValue(false)

    renderPage(useCases)
    await screen.findByText('Tesla')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(useCases.deleteEntry.execute).not.toHaveBeenCalled()
  })
})

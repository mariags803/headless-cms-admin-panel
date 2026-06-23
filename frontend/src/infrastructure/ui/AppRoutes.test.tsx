import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeWrapper } from './react/hooks/test-helpers/renderWithProviders'
import type { UseCases } from './react/providers/UseCasesProvider'
import { AppRoutes } from './AppRoutes'

function fakeUseCases(): UseCases {
  return {
    listSchemas: { execute: jest.fn().mockResolvedValue([]) } as never,
    getSchema: {} as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: {} as never,
    listEntries: {} as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: {} as never,
  }
}

function renderAt(path: string) {
  const { Wrapper } = makeWrapper(fakeUseCases())
  render(
    <Wrapper>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Wrapper>,
  )
}

describe('AppRoutes', () => {
  it('redirects / to /schemas', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Content Types' })).toBeInTheDocument()
  })

  it('renders SchemaListPage at /schemas', () => {
    renderAt('/schemas')
    expect(screen.getByRole('heading', { name: 'Content Types' })).toBeInTheDocument()
  })

  it('renders SchemaEditorPage at /schemas/new', () => {
    renderAt('/schemas/new')
    expect(screen.getByRole('heading', { name: 'New Content Type' })).toBeInTheDocument()
  })

  it('renders SchemaEditorPage at /schemas/:schemaId/edit', () => {
    renderAt('/schemas/car/edit')
    expect(screen.getByRole('heading', { name: 'Edit Content Type' })).toBeInTheDocument()
  })

  it('renders EntryListPage at /schemas/:schemaId/entries', () => {
    renderAt('/schemas/car/entries')
    expect(screen.getByRole('heading', { name: 'Entries — car' })).toBeInTheDocument()
  })

  it('renders EntryEditorPage at /schemas/:schemaId/entries/new', () => {
    renderAt('/schemas/car/entries/new')
    expect(screen.getByRole('heading', { name: 'New Entry — car' })).toBeInTheDocument()
  })

  it('renders EntryEditorPage at /schemas/:schemaId/entries/:entryId/edit', () => {
    renderAt('/schemas/car/entries/c1/edit')
    expect(screen.getByRole('heading', { name: 'Edit Entry — car' })).toBeInTheDocument()
  })
})

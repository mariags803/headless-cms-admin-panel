import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeWrapper } from './react/hooks/test-helpers/renderWithProviders'
import type { UseCases } from './react/providers/UseCasesProvider'
import { AppRoutes } from './AppRoutes'

function fakeUseCases(): UseCases {
  return {
    listSchemas: { execute: jest.fn().mockResolvedValue([]) } as never,
    getSchema: {
      execute: jest.fn().mockResolvedValue({
        id: 'car',
        name: 'Car',
        fields: [],
        createdAt: '',
        updatedAt: '',
      }),
    } as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: {} as never,
    listEntries: { execute: jest.fn().mockResolvedValue([]) } as never,
    getEntry: {
      execute: jest.fn().mockResolvedValue({
        id: 'c1',
        schemaId: 'car',
        data: {},
        createdAt: '',
        updatedAt: '',
      }),
    } as never,
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

  it('renders SchemaEditorPage at /schemas/:schemaId/edit', async () => {
    renderAt('/schemas/car/edit')
    expect(await screen.findByRole('heading', { name: 'Edit Content Type' })).toBeInTheDocument()
  })

  it('renders EntryListPage at /schemas/:schemaId/entries', async () => {
    renderAt('/schemas/car/entries')
    expect(await screen.findByRole('heading', { name: 'Car entries' })).toBeInTheDocument()
  })

  it('renders EntryEditorPage at /schemas/:schemaId/entries/new', async () => {
    renderAt('/schemas/car/entries/new')
    expect(await screen.findByRole('heading', { name: 'New Entry — Car' })).toBeInTheDocument()
  })

  it('renders EntryEditorPage at /schemas/:schemaId/entries/:entryId/edit', async () => {
    renderAt('/schemas/car/entries/c1/edit')
    expect(await screen.findByRole('heading', { name: 'Edit Entry — Car' })).toBeInTheDocument()
  })
})

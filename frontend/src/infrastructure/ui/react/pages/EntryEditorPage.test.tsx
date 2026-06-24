import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Entry, Schema } from '@cms/shared';
import type { UseCases } from '../providers/UseCasesProvider';
import { makeWrapper } from '../hooks/test-helpers/renderWithProviders';
import { EntryEditorPage } from './EntryEditorPage';

function fakeUseCases(overrides: Partial<UseCases> = {}): UseCases {
  return {
    listSchemas: {} as never,
    getSchema: { execute: jest.fn() } as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: {} as never,
    listEntries: {} as never,
    getEntry: { execute: jest.fn() } as never,
    createEntry: { execute: jest.fn() } as never,
    updateEntry: { execute: jest.fn() } as never,
    deleteEntry: {} as never,
    ...overrides,
  };
}

function renderPage(useCases: UseCases, path: string) {
  const { Wrapper } = makeWrapper(useCases);
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/schemas/:schemaId/entries" element={<p>Entries page</p>} />
          <Route path="/schemas/:schemaId/entries/new" element={<EntryEditorPage />} />
          <Route path="/schemas/:schemaId/entries/:entryId/edit" element={<EntryEditorPage />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

const carSchema: Schema = {
  id: 's1',
  name: 'Car',
  fields: [
    { id: 'f1', name: 'brand', type: 'text', required: true },
    { id: 'f2', name: 'year', type: 'number', required: false },
    { id: 'f3', name: 'available', type: 'boolean', required: false },
  ],
  createdAt: '',
  updatedAt: '',
};

const carEntry: Entry = {
  id: 'e1',
  schemaId: 's1',
  data: { f1: 'Tesla', f2: 2024, f3: true },
  createdAt: '',
  updatedAt: '',
};

describe('EntryEditorPage — new mode', () => {
  it('renders one input per schema field with defaults', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/new');

    expect(await screen.findByLabelText('brand')).toHaveValue('');
    expect(screen.getByLabelText('year')).toHaveValue(null);
    expect(screen.getByLabelText('available')).not.toBeChecked();
  });

  it('blocks submit and shows an alert when a required field is empty', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/new');

    await screen.findByLabelText('brand');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getAllByRole('alert').some((el) => /required/i.test(el.textContent ?? ''))).toBe(
      true,
    );
    expect(useCases.createEntry.execute).not.toHaveBeenCalled();
  });

  it('submits a new entry keyed by field id, then navigates to the entries list', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      createEntry: { execute: jest.fn().mockResolvedValue(carEntry) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/new');

    fireEvent.change(await screen.findByLabelText('brand'), { target: { value: 'Tesla' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(useCases.createEntry.execute).toHaveBeenCalledWith({
        schemaId: 's1',
        data: { f1: 'Tesla', f2: null, f3: false },
      }),
    );
    expect(await screen.findByText('Entries page')).toBeInTheDocument();
  });

  it('shows an alert and does not navigate when the create mutation fails', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      createEntry: { execute: jest.fn().mockRejectedValue(new Error('boom')) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/new');

    fireEvent.change(await screen.findByLabelText('brand'), { target: { value: 'Tesla' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
    expect(screen.queryByText('Entries page')).not.toBeInTheDocument();
  });

  it('disables Save and shows "Saving…" while the mutation is pending', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      createEntry: { execute: jest.fn(() => new Promise(() => {})) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/new');

    fireEvent.change(await screen.findByLabelText('brand'), { target: { value: 'Tesla' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('navigates to the entries list on Cancel without submitting', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/new');

    await screen.findByLabelText('brand');
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(await screen.findByText('Entries page')).toBeInTheDocument();
    expect(useCases.createEntry.execute).not.toHaveBeenCalled();
  });
});

describe('EntryEditorPage — edit mode', () => {
  it('shows a loading state while schema/entry are being fetched', () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn(() => new Promise(() => {})) } as never,
      getEntry: { execute: jest.fn(() => new Promise(() => {})) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/e1/edit');

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('seeds the form with the resolved entry data', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      getEntry: { execute: jest.fn().mockResolvedValue(carEntry) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/e1/edit');

    expect(await screen.findByLabelText('brand')).toHaveValue('Tesla');
    expect(screen.getByLabelText('year')).toHaveValue(2024);
    expect(screen.getByLabelText('available')).toBeChecked();
  });

  it('shows an alert when the entry fails to load', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      getEntry: { execute: jest.fn().mockRejectedValue(new Error('network down')) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/e1/edit');

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });

  it('submits an update with the edited data, then navigates', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      getEntry: { execute: jest.fn().mockResolvedValue(carEntry) } as never,
      updateEntry: { execute: jest.fn().mockResolvedValue(carEntry) } as never,
    });
    renderPage(useCases, '/schemas/s1/entries/e1/edit');

    fireEvent.change(await screen.findByLabelText('brand'), { target: { value: 'BMW' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(useCases.updateEntry.execute).toHaveBeenCalledWith('e1', {
        data: { f1: 'BMW', f2: 2024, f3: true },
      }),
    );
    expect(await screen.findByText('Entries page')).toBeInTheDocument();
  });
});

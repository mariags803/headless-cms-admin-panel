import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Schema } from '@cms/shared';
import type { UseCases } from '../providers/UseCasesProvider';
import { makeWrapper } from '../hooks/test-helpers/renderWithProviders';
import { SchemaEditorPage } from './SchemaEditorPage';

function fakeUseCases(overrides: Partial<UseCases> = {}): UseCases {
  return {
    listSchemas: { execute: jest.fn().mockResolvedValue([]) } as never,
    getSchema: { execute: jest.fn() } as never,
    createSchema: { execute: jest.fn() } as never,
    updateSchema: { execute: jest.fn() } as never,
    deleteSchema: {} as never,
    listEntries: {} as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
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
          <Route path="/schemas" element={<p>Content Types page</p>} />
          <Route path="/schemas/new" element={<SchemaEditorPage />} />
          <Route path="/schemas/:schemaId/edit" element={<SchemaEditorPage />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

const carSchema: Schema = {
  id: 's1',
  name: 'Car',
  fields: [{ id: 'f1', name: 'brand', type: 'text', required: true }],
  createdAt: '',
  updatedAt: '',
};

describe('SchemaEditorPage — new mode', () => {
  it('renders an empty form with no fields', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.queryAllByLabelText(/field \d+ name/i)).toHaveLength(0);
  });

  it('adds a new empty field row when "Add Field" is clicked', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    expect(screen.getByLabelText('Field 1 name')).toHaveValue('');
  });

  it('removes a field row when Remove is clicked', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 1 name'), { target: { value: 'brand' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 2 name'), { target: { value: 'model' } });

    fireEvent.click(screen.getAllByLabelText('Remove field')[0]);

    expect(screen.getByLabelText('Field 1 name')).toHaveValue('model');
    expect(screen.queryAllByLabelText(/field \d+ name/i)).toHaveLength(1);
  });

  it('reorders fields with the move down/up controls', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 1 name'), { target: { value: 'brand' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 2 name'), { target: { value: 'model' } });

    fireEvent.click(screen.getAllByLabelText('Move field down')[0]);

    expect(screen.getByLabelText('Field 1 name')).toHaveValue('model');
    expect(screen.getByLabelText('Field 2 name')).toHaveValue('brand');
  });

  it('blocks submit and shows an alert when the schema name is empty', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
    expect(useCases.createSchema.execute).not.toHaveBeenCalled();
  });

  it('blocks submit and shows an alert when a field name is empty', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Car' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getAllByRole('alert').some((el) => /required/i.test(el.textContent ?? ''))).toBe(
      true,
    );
    expect(useCases.createSchema.execute).not.toHaveBeenCalled();
  });

  it('blocks submit and shows an alert when two fields share the same name', () => {
    const useCases = fakeUseCases();
    renderPage(useCases, '/schemas/new');

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Car' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 1 name'), { target: { value: 'brand' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 2 name'), { target: { value: 'brand' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getAllByRole('alert').some((el) => /duplicate/i.test(el.textContent ?? ''))).toBe(
      true,
    );
    expect(useCases.createSchema.execute).not.toHaveBeenCalled();
  });

  it('submits a new schema with fields carrying no id, then navigates to /schemas', async () => {
    const created: Schema = { ...carSchema };
    const useCases = fakeUseCases({
      createSchema: { execute: jest.fn().mockResolvedValue(created) } as never,
    });
    renderPage(useCases, '/schemas/new');

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Car' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 1 name'), { target: { value: 'brand' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(useCases.createSchema.execute).toHaveBeenCalledWith({
        name: 'Car',
        fields: [{ name: 'brand', type: 'text', required: false }],
      }),
    );
    expect(await screen.findByText('Content Types page')).toBeInTheDocument();
  });

  it('shows an alert and does not navigate when the create mutation fails', async () => {
    const useCases = fakeUseCases({
      createSchema: { execute: jest.fn().mockRejectedValue(new Error('boom')) } as never,
    });
    renderPage(useCases, '/schemas/new');

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Car' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
    expect(screen.queryByText('Content Types page')).not.toBeInTheDocument();
  });
});

describe('SchemaEditorPage — edit mode', () => {
  it('shows a loading state while the schema is being fetched', () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn(() => new Promise(() => {})) } as never,
    });
    renderPage(useCases, '/schemas/s1/edit');

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('seeds the form with the resolved schema', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
    });
    renderPage(useCases, '/schemas/s1/edit');

    expect(await screen.findByLabelText(/^name$/i)).toHaveValue('Car');
    expect(screen.getByLabelText('Field 1 name')).toHaveValue('brand');
    expect(screen.getByLabelText('Field 1 type')).toHaveValue('text');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('shows an alert when the schema fails to load', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockRejectedValue(new Error('network down')) } as never,
    });
    renderPage(useCases, '/schemas/s1/edit');

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });

  it('submits an update keeping ids on existing fields and omitting them on new ones, then navigates', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      updateSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
    });
    renderPage(useCases, '/schemas/s1/edit');

    await screen.findByLabelText(/^name$/i);
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Field 2 name'), { target: { value: 'model' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(useCases.updateSchema.execute).toHaveBeenCalledWith('s1', {
        name: 'Car',
        fields: [
          { id: 'f1', name: 'brand', type: 'text', required: true },
          { name: 'model', type: 'text', required: false },
        ],
      }),
    );
    expect(await screen.findByText('Content Types page')).toBeInTheDocument();
  });

  it('disables Save and shows "Saving…" while the mutation is pending', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(carSchema) } as never,
      updateSchema: { execute: jest.fn(() => new Promise(() => {})) } as never,
    });
    renderPage(useCases, '/schemas/s1/edit');

    await screen.findByLabelText(/^name$/i);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('button', { name: /saving/i })).toBeDisabled();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Entry, Field, Schema } from '@cms/shared';
import type { UseCases } from '../../providers/UseCasesProvider';
import { makeWrapper } from '../../hooks/test-helpers/renderWithProviders';
import { ReferenceInput } from './ReferenceInput';

function fakeUseCases(overrides: Partial<UseCases> = {}): UseCases {
  return {
    listSchemas: {} as never,
    getSchema: { execute: jest.fn() } as never,
    createSchema: {} as never,
    updateSchema: {} as never,
    deleteSchema: {} as never,
    listEntries: { execute: jest.fn() } as never,
    getEntry: {} as never,
    createEntry: {} as never,
    updateEntry: {} as never,
    deleteEntry: {} as never,
    ...overrides,
  };
}

function renderInput(useCases: UseCases, props: Partial<Parameters<typeof ReferenceInput>[0]> = {}) {
  const { Wrapper } = makeWrapper(useCases);
  const field: Field = { id: 'f1', name: 'Owner', type: 'reference', required: false, refSchemaId: 's2' };
  return render(
    <Wrapper>
      <MemoryRouter>
        <ReferenceInput field={field} value={null} onChange={jest.fn()} {...props} />
      </MemoryRouter>
    </Wrapper>,
  );
}

const personSchema: Schema = {
  id: 's2',
  name: 'Person',
  fields: [{ id: 'pf1', name: 'name', type: 'text', required: true }],
  createdAt: '',
  updatedAt: '',
};

const noTextSchema: Schema = {
  id: 's2',
  name: 'Person',
  fields: [{ id: 'pf1', name: 'age', type: 'number', required: true }],
  createdAt: '',
  updatedAt: '',
};

const aliceEntry: Entry = { id: 'e1', schemaId: 's2', data: { pf1: 'Alice' }, createdAt: '', updatedAt: '' };
const bobEntry: Entry = { id: 'e2', schemaId: 's2', data: { pf1: 'Bob' }, createdAt: '', updatedAt: '' };

describe('ReferenceInput', () => {
  it('lists target entries labeled by their first text field', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry, bobEntry]) } as never,
    });
    renderInput(useCases);

    expect(await screen.findByRole('option', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument();
  });

  it('falls back to the entry id when the target schema has no text field', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(noTextSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry]) } as never,
    });
    renderInput(useCases);

    expect(await screen.findByRole('option', { name: 'e1' })).toBeInTheDocument();
  });

  it('calls onChange with the selected entry id', async () => {
    const onChange = jest.fn();
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry, bobEntry]) } as never,
    });
    renderInput(useCases, { onChange });

    await screen.findByRole('option', { name: 'Alice' });
    fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'e2' } });

    expect(onChange).toHaveBeenCalledWith('e2');
  });

  it('calls onChange with null when the placeholder is selected', async () => {
    const onChange = jest.fn();
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry]) } as never,
    });
    renderInput(useCases, { value: 'e1', onChange });

    await screen.findByRole('option', { name: 'Alice' });
    fireEvent.change(screen.getByLabelText('Owner'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('renders a jump-to-entry link when a value is selected', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry]) } as never,
    });
    renderInput(useCases, { value: 'e1' });

    const link = await screen.findByRole('link', { name: /view entry/i });
    expect(link).toHaveAttribute('href', '/schemas/s2/entries/e1/edit');
  });

  it('renders no jump link when value is null', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry]) } as never,
    });
    renderInput(useCases, { value: null });

    await screen.findByRole('option', { name: 'Alice' });
    expect(screen.queryByRole('link', { name: /view entry/i })).not.toBeInTheDocument();
  });

  it('shows an empty-state message when the target schema has no entries', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([]) } as never,
    });
    renderInput(useCases);

    expect(await screen.findByText(/no entries available/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Owner')).not.toBeInTheDocument();
  });

  it('shows the validation error when set', async () => {
    const useCases = fakeUseCases({
      getSchema: { execute: jest.fn().mockResolvedValue(personSchema) } as never,
      listEntries: { execute: jest.fn().mockResolvedValue([aliceEntry]) } as never,
    });
    renderInput(useCases, { error: 'Required' });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Required'));
  });
});

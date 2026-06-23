import { CreateEntry } from './CreateEntry';
import { UpdateEntry } from './UpdateEntry';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';
import { InMemorySchemaRepository } from '../schema/InMemorySchemaRepository';
import { CreateSchema } from '../schema/CreateSchema';
import { EntryNotFound, InvalidEntry } from '../../domain/entry/EntryErrors';

describe('UpdateEntry', () => {
  async function setup() {
    const schemaRepo = new InMemorySchemaRepository();
    const entryRepo = new InMemoryEntryRepository();
    const schema = await new CreateSchema(schemaRepo).execute({
      name: 'Car',
      fields: [{ id: 'f-brand', name: 'brand', type: 'text', required: true }],
    });
    const entry = await new CreateEntry(entryRepo, schemaRepo).execute({
      schemaId: schema.id,
      data: { 'f-brand': 'Toyota' },
    });
    return { schemaRepo, entryRepo, schema, entry };
  }

  it('replaces data and bumps updatedAt, keeping schemaId/createdAt', async () => {
    const { schemaRepo, entryRepo, entry } = await setup();
    const useCase = new UpdateEntry(entryRepo, schemaRepo);

    const updated = await useCase.execute({ id: entry.id, data: { 'f-brand': 'Honda' } });

    expect(updated.id).toBe(entry.id);
    expect(updated.schemaId).toBe(entry.schemaId);
    expect(updated.createdAt).toBe(entry.createdAt);
    expect(updated.data).toEqual({ 'f-brand': 'Honda' });
    expect(updated.updatedAt >= entry.createdAt).toBe(true);
  });

  it('throws EntryNotFound for an unknown id', async () => {
    const { schemaRepo, entryRepo } = await setup();
    const useCase = new UpdateEntry(entryRepo, schemaRepo);

    await expect(
      useCase.execute({ id: 'does-not-exist', data: {} }),
    ).rejects.toBeInstanceOf(EntryNotFound);
  });

  it('throws InvalidEntry when a required field is missing', async () => {
    const { schemaRepo, entryRepo, entry } = await setup();
    const useCase = new UpdateEntry(entryRepo, schemaRepo);

    await expect(
      useCase.execute({ id: entry.id, data: {} }),
    ).rejects.toBeInstanceOf(InvalidEntry);
  });
});

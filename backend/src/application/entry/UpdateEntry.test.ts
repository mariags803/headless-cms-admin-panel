import { CreateEntry } from './CreateEntry';
import { UpdateEntry } from './UpdateEntry';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';
import { InMemorySchemaRepository } from '../schema/InMemorySchemaRepository';
import { CreateSchema } from '../schema/CreateSchema';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { EntryNotFound, InvalidEntry } from '../../domain/entry/EntryErrors';

describe('UpdateEntry', () => {
  async function setup() {
    const schemaRepo = new InMemorySchemaRepository();
    const entryRepo = new InMemoryEntryRepository();
    const schema = await new CreateSchema(schemaRepo, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'brand', type: 'text', required: true } as never],
    });
    const fieldId = schema.fields[0].id;
    const entry = await new CreateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher()).execute({
      schemaId: schema.id,
      data: { [fieldId]: 'Toyota' },
    });
    return { schemaRepo, entryRepo, schema, entry, fieldId };
  }

  it('replaces data and bumps updatedAt, keeping schemaId/createdAt', async () => {
    const { schemaRepo, entryRepo, entry, fieldId } = await setup();
    const useCase = new UpdateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher());

    const updated = await useCase.execute({ id: entry.id, data: { [fieldId]: 'Honda' } });

    expect(updated.id).toBe(entry.id);
    expect(updated.schemaId).toBe(entry.schemaId);
    expect(updated.createdAt).toBe(entry.createdAt);
    expect(updated.data).toEqual({ [fieldId]: 'Honda' });
    expect(updated.updatedAt >= entry.createdAt).toBe(true);
  });

  it('publishes an entry.updated event', async () => {
    const { schemaRepo, entryRepo, entry, fieldId } = await setup();
    const publisher = new InMemoryEventPublisher();
    const useCase = new UpdateEntry(entryRepo, schemaRepo, publisher);

    const updated = await useCase.execute({ id: entry.id, data: { [fieldId]: 'Honda' } });

    expect(publisher.events).toEqual([{ type: 'entry.updated', entry: updated }]);
  });

  it('throws EntryNotFound for an unknown id', async () => {
    const { schemaRepo, entryRepo } = await setup();
    const useCase = new UpdateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({ id: 'does-not-exist', data: {} }),
    ).rejects.toBeInstanceOf(EntryNotFound);
  });

  it('throws InvalidEntry when a required field is missing', async () => {
    const { schemaRepo, entryRepo, entry } = await setup();
    const useCase = new UpdateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({ id: entry.id, data: {} }),
    ).rejects.toBeInstanceOf(InvalidEntry);
  });
});

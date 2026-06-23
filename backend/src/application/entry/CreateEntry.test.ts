import { CreateEntry } from './CreateEntry';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';
import { InMemorySchemaRepository } from '../schema/InMemorySchemaRepository';
import { CreateSchema } from '../schema/CreateSchema';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { InvalidEntry } from '../../domain/entry/EntryErrors';

describe('CreateEntry', () => {
  async function setup() {
    const schemaRepo = new InMemorySchemaRepository();
    const entryRepo = new InMemoryEntryRepository();
    const schema = await new CreateSchema(schemaRepo, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'brand', type: 'text', required: true } as never],
    });
    return { schemaRepo, entryRepo, schema, fieldId: schema.fields[0].id };
  }

  it('creates an entry with generated id and matching createdAt/updatedAt', async () => {
    const { schemaRepo, entryRepo, schema, fieldId } = await setup();
    const useCase = new CreateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher());

    const entry = await useCase.execute({ schemaId: schema.id, data: { [fieldId]: 'Toyota' } });

    expect(entry.id).toBeTruthy();
    expect(entry.schemaId).toBe(schema.id);
    expect(entry.createdAt).toBe(entry.updatedAt);
    expect(await entryRepo.findById(entry.id)).toEqual(entry);
  });

  it('publishes an entry.created event', async () => {
    const { schemaRepo, entryRepo, schema, fieldId } = await setup();
    const publisher = new InMemoryEventPublisher();
    const useCase = new CreateEntry(entryRepo, schemaRepo, publisher);

    const entry = await useCase.execute({ schemaId: schema.id, data: { [fieldId]: 'Toyota' } });

    expect(publisher.events).toEqual([{ type: 'entry.created', entry }]);
  });

  it('throws SchemaNotFound for an unknown schemaId', async () => {
    const { schemaRepo, entryRepo } = await setup();
    const useCase = new CreateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({ schemaId: 'does-not-exist', data: {} }),
    ).rejects.toBeInstanceOf(SchemaNotFound);
  });

  it('throws InvalidEntry when a required field is missing', async () => {
    const { schemaRepo, entryRepo, schema } = await setup();
    const useCase = new CreateEntry(entryRepo, schemaRepo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({ schemaId: schema.id, data: {} }),
    ).rejects.toBeInstanceOf(InvalidEntry);
  });
});

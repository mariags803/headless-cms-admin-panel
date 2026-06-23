import { GetContentEntry } from './GetContentEntry';
import { InMemorySchemaRepository } from '../schema/InMemorySchemaRepository';
import { InMemoryEntryRepository } from '../entry/InMemoryEntryRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { EntryNotFound } from '../../domain/entry/EntryErrors';

describe('GetContentEntry', () => {
  async function seed() {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    await schemas.save({
      id: 's1',
      name: 'Car',
      fields: [{ id: 'f-brand', name: 'brand', type: 'text', required: true }],
      createdAt: 't',
      updatedAt: 't',
    });
    await schemas.save({ id: 's2', name: 'Person', fields: [], createdAt: 't', updatedAt: 't' });
    await entries.save({ id: 'e1', schemaId: 's1', data: { 'f-brand': 'Toyota' }, createdAt: 't', updatedAt: 't' });
    return { schemas, entries };
  }

  it('resolves field ids to names for the requested entry', async () => {
    const { schemas, entries } = await seed();

    const result = await new GetContentEntry(schemas, entries).execute('Car', 'e1');

    expect(result).toEqual({ id: 'e1', schemaId: 's1', data: { brand: 'Toyota' }, createdAt: 't', updatedAt: 't' });
  });

  it('throws SchemaNotFound for an unknown schema name', async () => {
    const { schemas, entries } = await seed();

    await expect(new GetContentEntry(schemas, entries).execute('does-not-exist', 'e1')).rejects.toBeInstanceOf(
      SchemaNotFound,
    );
  });

  it('throws EntryNotFound for an unknown entry id', async () => {
    const { schemas, entries } = await seed();

    await expect(new GetContentEntry(schemas, entries).execute('Car', 'does-not-exist')).rejects.toBeInstanceOf(
      EntryNotFound,
    );
  });

  it('throws EntryNotFound when the entry belongs to a different schema', async () => {
    const { schemas, entries } = await seed();

    await expect(new GetContentEntry(schemas, entries).execute('Person', 'e1')).rejects.toBeInstanceOf(
      EntryNotFound,
    );
  });
});

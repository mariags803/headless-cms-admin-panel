import { ListContent } from './ListContent';
import { InMemorySchemaRepository } from '../schema/InMemorySchemaRepository';
import { InMemoryEntryRepository } from '../entry/InMemoryEntryRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';

describe('ListContent', () => {
  it('resolves field ids to names for every entry of the named schema', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    await schemas.save({
      id: 's1',
      name: 'Car',
      fields: [{ id: 'f-brand', name: 'brand', type: 'text', required: true }],
      createdAt: 't',
      updatedAt: 't',
    });
    await entries.save({ id: 'e1', schemaId: 's1', data: { 'f-brand': 'Toyota' }, createdAt: 't', updatedAt: 't' });

    const result = await new ListContent(schemas, entries).execute('Car');

    expect(result).toEqual([
      { id: 'e1', schemaId: 's1', data: { brand: 'Toyota' }, createdAt: 't', updatedAt: 't' },
    ]);
  });

  it('throws SchemaNotFound for an unknown schema name', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();

    await expect(new ListContent(schemas, entries).execute('does-not-exist')).rejects.toBeInstanceOf(
      SchemaNotFound,
    );
  });
});

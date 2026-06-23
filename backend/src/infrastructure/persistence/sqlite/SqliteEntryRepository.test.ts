import type Database from 'better-sqlite3';
import { createDb } from './db';
import { SqliteSchemaRepository } from './SqliteSchemaRepository';
import { SqliteEntryRepository } from './SqliteEntryRepository';
import type { Entry, Schema } from '@cms/shared';

describe('SqliteEntryRepository', () => {
  let db: Database.Database;
  let repo: SqliteEntryRepository;

  beforeEach(async () => {
    db = createDb(':memory:');
    repo = new SqliteEntryRepository(db);

    const schemaRepo = new SqliteSchemaRepository(db);
    await schemaRepo.save(makeSchema({ id: 'schema-1' }));
    await schemaRepo.save(makeSchema({ id: 'schema-2' }));
  });

  afterEach(() => {
    db.close();
  });

  function makeSchema(overrides: Partial<Schema> = {}): Schema {
    return {
      id: 'schema-1',
      name: 'Car',
      fields: [{ id: 'f1', name: 'brand', type: 'text', required: true }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  function makeEntry(overrides: Partial<Entry> = {}): Entry {
    return {
      id: 'entry-1',
      schemaId: 'schema-1',
      data: { f1: 'Toyota' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('round-trips an entry including its data JSON', async () => {
    const entry = makeEntry();
    await repo.save(entry);

    expect(await repo.findById(entry.id)).toEqual(entry);
  });

  it('returns null for a missing id', async () => {
    expect(await repo.findById('missing')).toBeNull();
  });

  it('findBySchemaId filters across multiple schemas', async () => {
    await repo.save(makeEntry({ id: 'entry-1', schemaId: 'schema-1' }));
    await repo.save(makeEntry({ id: 'entry-2', schemaId: 'schema-2' }));

    const result = await repo.findBySchemaId('schema-1');
    expect(result.map((e) => e.id)).toEqual(['entry-1']);
  });

  it('upserts on save, preserving schemaId and createdAt', async () => {
    const entry = makeEntry();
    await repo.save(entry);
    await repo.save({ ...entry, data: { f1: 'Honda' } });

    const all = await repo.findBySchemaId('schema-1');
    expect(all).toHaveLength(1);
    expect(all[0].data).toEqual({ f1: 'Honda' });
    expect(all[0].schemaId).toBe('schema-1');
    expect(all[0].createdAt).toBe(entry.createdAt);
  });

  it('removes an entry on delete', async () => {
    const entry = makeEntry();
    await repo.save(entry);
    await repo.delete(entry.id);

    expect(await repo.findById(entry.id)).toBeNull();
  });
});

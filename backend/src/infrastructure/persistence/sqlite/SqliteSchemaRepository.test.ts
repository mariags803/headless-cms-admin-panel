import type Database from 'better-sqlite3';
import { createDb } from './db';
import { SqliteSchemaRepository } from './SqliteSchemaRepository';
import type { Schema } from '@cms/shared';

describe('SqliteSchemaRepository', () => {
  let db: Database.Database;
  let repo: SqliteSchemaRepository;

  beforeEach(() => {
    db = createDb(':memory:');
    repo = new SqliteSchemaRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  function makeSchema(overrides: Partial<Schema> = {}): Schema {
    return {
      id: 'schema-1',
      name: 'Car',
      fields: [
        { id: 'f1', name: 'brand', type: 'text', required: true },
        { id: 'f2', name: 'owner', type: 'reference', required: false, refSchemaId: 'schema-2' },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('round-trips a schema including nested fields', async () => {
    const schema = makeSchema();
    await repo.save(schema);

    expect(await repo.findById(schema.id)).toEqual(schema);
  });

  it('returns null for a missing id', async () => {
    expect(await repo.findById('missing')).toBeNull();
  });

  it('returns multiple saved schemas via findAll', async () => {
    await repo.save(makeSchema({ id: 'schema-1', name: 'Car' }));
    await repo.save(makeSchema({ id: 'schema-2', name: 'Person' }));

    const all = await repo.findAll();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.name).sort()).toEqual(['Car', 'Person']);
  });

  it('upserts on save with an existing id instead of duplicating', async () => {
    const schema = makeSchema();
    await repo.save(schema);
    await repo.save({ ...schema, name: 'Car (used)' });

    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Car (used)');
  });

  it('removes a schema on delete', async () => {
    const schema = makeSchema();
    await repo.save(schema);
    await repo.delete(schema.id);

    expect(await repo.findById(schema.id)).toBeNull();
  });
});

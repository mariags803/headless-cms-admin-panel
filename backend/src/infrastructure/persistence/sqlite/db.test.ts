import { createDb } from './db';

describe('createDb', () => {
  it('creates the schemas and entries tables', () => {
    const db = createDb(':memory:');

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row: any) => row.name);

    expect(tables).toContain('schemas');
    expect(tables).toContain('entries');
  });

  it('creates the entries-by-schema index', () => {
    const db = createDb(':memory:');

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row: any) => row.name);

    expect(indexes).toContain('idx_entries_schema');
  });

  it('enables foreign keys and cascades deletes from schemas to entries', () => {
    const db = createDb(':memory:');
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO schemas (id, name, fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run('schema-1', 'Car', '[]', now, now);

    db.prepare(
      'INSERT INTO entries (id, schema_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run('entry-1', 'schema-1', '{}', now, now);

    db.prepare('DELETE FROM schemas WHERE id = ?').run('schema-1');

    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get('entry-1');
    expect(entry).toBeUndefined();
  });

  it('rejects an entry referencing a non-existent schema', () => {
    const db = createDb(':memory:');
    const now = new Date().toISOString();

    expect(() =>
      db
        .prepare(
          'INSERT INTO entries (id, schema_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run('entry-1', 'missing-schema', '{}', now, now),
    ).toThrow();
  });
});

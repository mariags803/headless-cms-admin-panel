import type Database from 'better-sqlite3';
import type { Entry } from '@cms/shared';
import type { EntryRepository } from '../../../domain/entry/EntryRepository';

interface EntryRow {
  id: string;
  schema_id: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    schemaId: row.schema_id,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteEntryRepository implements EntryRepository {
  constructor(private readonly db: Database.Database) {}

  async findBySchemaId(schemaId: string): Promise<Entry[]> {
    const rows = this.db.prepare('SELECT * FROM entries WHERE schema_id = ?').all(schemaId) as EntryRow[];
    return rows.map(toEntry);
  }

  async findById(id: string): Promise<Entry | null> {
    const row = this.db.prepare('SELECT * FROM entries WHERE id = ?').get(id) as EntryRow | undefined;
    return row ? toEntry(row) : null;
  }

  async save(entry: Entry): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO entries (id, schema_id, data, created_at, updated_at)
         VALUES (@id, @schemaId, @data, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           data = @data, updated_at = @updatedAt`,
      )
      .run({
        id: entry.id,
        schemaId: entry.schemaId,
        data: JSON.stringify(entry.data),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM entries WHERE id = ?').run(id);
  }
}

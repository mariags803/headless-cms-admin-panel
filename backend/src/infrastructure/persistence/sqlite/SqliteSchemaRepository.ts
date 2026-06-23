import type Database from 'better-sqlite3';
import type { Schema } from '@cms/shared';
import type { SchemaRepository } from '../../../domain/schema/SchemaRepository';

interface SchemaRow {
  id: string;
  name: string;
  fields: string;
  created_at: string;
  updated_at: string;
}

function toSchema(row: SchemaRow): Schema {
  return {
    id: row.id,
    name: row.name,
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteSchemaRepository implements SchemaRepository {
  constructor(private readonly db: Database.Database) {}

  async findAll(): Promise<Schema[]> {
    const rows = this.db.prepare('SELECT * FROM schemas').all() as SchemaRow[];
    return rows.map(toSchema);
  }

  async findById(id: string): Promise<Schema | null> {
    const row = this.db.prepare('SELECT * FROM schemas WHERE id = ?').get(id) as SchemaRow | undefined;
    return row ? toSchema(row) : null;
  }

  async save(schema: Schema): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO schemas (id, name, fields, created_at, updated_at)
         VALUES (@id, @name, @fields, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           name = @name, fields = @fields, updated_at = @updatedAt`,
      )
      .run({
        id: schema.id,
        name: schema.name,
        fields: JSON.stringify(schema.fields),
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
      });
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM schemas WHERE id = ?').run(id);
  }
}

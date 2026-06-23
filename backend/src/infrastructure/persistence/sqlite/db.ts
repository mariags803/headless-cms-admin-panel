import Database from 'better-sqlite3';

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS schemas (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  fields TEXT NOT NULL,            -- JSON: Field[]
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, schema_id TEXT NOT NULL,
  data TEXT NOT NULL,              -- JSON: Record<fieldId, FieldValue>
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entries_schema ON entries(schema_id);
`;

export function createDb(filename: string): Database.Database {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.exec(MIGRATIONS);
  return db;
}

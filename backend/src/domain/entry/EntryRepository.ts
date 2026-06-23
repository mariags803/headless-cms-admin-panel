import type { Entry } from './Entry';

export interface EntryRepository {
  findBySchemaId(schemaId: string): Promise<Entry[]>;
  findById(id: string): Promise<Entry | null>;
  save(entry: Entry): Promise<void>;
  delete(id: string): Promise<void>;
}

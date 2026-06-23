import type { Entry, FieldValue } from '@cms/shared';

export interface NewEntryInput {
  schemaId: string;
  data: Record<string, FieldValue>;
}

export interface EntryUpdateInput {
  data: Record<string, FieldValue>;
}

export interface EntryRepository {
  findAllBySchema(schemaId: string): Promise<Entry[]>;
  findById(id: string): Promise<Entry | null>;
  create(input: NewEntryInput): Promise<Entry>;
  update(id: string, input: EntryUpdateInput): Promise<Entry>;
  delete(id: string): Promise<void>;
}

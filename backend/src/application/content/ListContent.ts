import type { FieldValue } from '../../domain/entry/Entry';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { resolveEntryData } from './resolveEntryData';

export interface ContentEntry {
  id: string;
  schemaId: string;
  data: Record<string, FieldValue>;
  createdAt: string;
  updatedAt: string;
}

export class ListContent {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly entries: EntryRepository,
  ) {}

  async execute(schemaName: string): Promise<ContentEntry[]> {
    const schema = await this.schemas.findByName(schemaName);
    if (!schema) throw new SchemaNotFound(schemaName);

    const entries = await this.entries.findBySchemaId(schema.id);
    return entries.map((entry) => ({ ...entry, data: resolveEntryData(schema, entry) }));
  }
}

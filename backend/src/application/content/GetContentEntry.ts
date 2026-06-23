import type { EntryRepository } from '../../domain/entry/EntryRepository';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { EntryNotFound } from '../../domain/entry/EntryErrors';
import { resolveEntryData } from './resolveEntryData';
import type { ContentEntry } from './ListContent';

export class GetContentEntry {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly entries: EntryRepository,
  ) {}

  async execute(schemaName: string, entryId: string): Promise<ContentEntry> {
    const schema = await this.schemas.findByName(schemaName);
    if (!schema) throw new SchemaNotFound(schemaName);

    const entry = await this.entries.findById(entryId);
    if (!entry || entry.schemaId !== schema.id) throw new EntryNotFound(entryId);

    return { ...entry, data: resolveEntryData(schema, entry) };
  }
}

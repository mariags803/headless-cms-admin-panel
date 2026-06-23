import { validateEntry, type Entry, type FieldValue } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { EntryNotFound, InvalidEntry } from '../../domain/entry/EntryErrors';

export interface UpdateEntryInput {
  id: string;
  data: Record<string, FieldValue>;
}

export class UpdateEntry {
  constructor(
    private readonly entries: EntryRepository,
    private readonly schemas: SchemaRepository,
  ) {}

  // schemaId is not updatable via PUT — only data changes.
  async execute(input: UpdateEntryInput): Promise<Entry> {
    const existing = await this.entries.findById(input.id);
    if (!existing) throw new EntryNotFound(input.id);

    const schema = await this.schemas.findById(existing.schemaId);
    if (!schema) throw new SchemaNotFound(existing.schemaId);

    const errors = validateEntry(input.data, schema);
    if (errors.length) throw new InvalidEntry(errors);

    const updated: Entry = {
      ...existing,
      data: input.data,
      updatedAt: new Date().toISOString(),
    };

    await this.entries.save(updated);
    return updated;
  }
}

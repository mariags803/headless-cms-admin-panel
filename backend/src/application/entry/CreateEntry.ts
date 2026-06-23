import { randomUUID } from 'node:crypto';
import { validateEntry, type Entry, type FieldValue } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { InvalidEntry } from '../../domain/entry/EntryErrors';

export interface NewEntryInput {
  schemaId: string;
  data: Record<string, FieldValue>;
}

export class CreateEntry {
  constructor(
    private readonly entries: EntryRepository,
    private readonly schemas: SchemaRepository,
  ) {}

  async execute(input: NewEntryInput): Promise<Entry> {
    const schema = await this.schemas.findById(input.schemaId);
    if (!schema) throw new SchemaNotFound(input.schemaId);

    const errors = validateEntry(input.data, schema);
    if (errors.length) throw new InvalidEntry(errors);

    const now = new Date().toISOString();
    const entry: Entry = {
      id: randomUUID(),
      schemaId: input.schemaId,
      data: input.data,
      createdAt: now,
      updatedAt: now,
    };

    await this.entries.save(entry);
    return entry;
  }
}

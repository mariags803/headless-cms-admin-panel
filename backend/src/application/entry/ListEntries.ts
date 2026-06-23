import type { Entry } from '../../domain/entry/Entry';
import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class ListEntries {
  constructor(private readonly entries: EntryRepository) {}

  async execute(schemaId: string): Promise<Entry[]> {
    return this.entries.findBySchemaId(schemaId);
  }
}

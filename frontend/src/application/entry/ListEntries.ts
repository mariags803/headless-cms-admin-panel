import type { Entry } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class ListEntries {
  private readonly entries: EntryRepository;

  constructor(entries: EntryRepository) {
    this.entries = entries;
  }

  execute(schemaId: string): Promise<Entry[]> {
    return this.entries.findAllBySchema(schemaId);
  }
}

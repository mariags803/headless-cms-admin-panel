import type { Entry } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class ListEntries {
  constructor(private readonly entries: EntryRepository) {}

  execute(schemaId: string): Promise<Entry[]> {
    return this.entries.findAllBySchema(schemaId);
  }
}

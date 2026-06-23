import type { Entry } from '@cms/shared';
import type { EntryRepository, NewEntryInput } from '../../domain/entry/EntryRepository';

export class CreateEntry {
  private readonly entries: EntryRepository;

  constructor(entries: EntryRepository) {
    this.entries = entries;
  }

  execute(input: NewEntryInput): Promise<Entry> {
    return this.entries.create(input);
  }
}

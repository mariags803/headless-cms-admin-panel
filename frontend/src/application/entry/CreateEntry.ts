import type { Entry } from '@cms/shared';
import type { EntryRepository, NewEntryInput } from '../../domain/entry/EntryRepository';

export class CreateEntry {
  constructor(private readonly entries: EntryRepository) {}

  execute(input: NewEntryInput): Promise<Entry> {
    return this.entries.create(input);
  }
}

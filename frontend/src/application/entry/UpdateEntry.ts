import type { Entry } from '@cms/shared';
import type { EntryRepository, EntryUpdateInput } from '../../domain/entry/EntryRepository';

export class UpdateEntry {
  private readonly entries: EntryRepository;

  constructor(entries: EntryRepository) {
    this.entries = entries;
  }

  execute(id: string, input: EntryUpdateInput): Promise<Entry> {
    return this.entries.update(id, input);
  }
}

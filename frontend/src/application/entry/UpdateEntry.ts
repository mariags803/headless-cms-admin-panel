import type { Entry } from '@cms/shared';
import type { EntryRepository, EntryUpdateInput } from '../../domain/entry/EntryRepository';

export class UpdateEntry {
  constructor(private readonly entries: EntryRepository) {}

  execute(id: string, input: EntryUpdateInput): Promise<Entry> {
    return this.entries.update(id, input);
  }
}

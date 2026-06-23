import type { Entry } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class GetEntry {
  private readonly entries: EntryRepository;

  constructor(entries: EntryRepository) {
    this.entries = entries;
  }

  execute(id: string): Promise<Entry | null> {
    return this.entries.findById(id);
  }
}

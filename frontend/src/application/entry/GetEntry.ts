import type { Entry } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class GetEntry {
  constructor(private readonly entries: EntryRepository) {}

  execute(id: string): Promise<Entry | null> {
    return this.entries.findById(id);
  }
}

import type { Entry } from '../../domain/entry/Entry';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import { EntryNotFound } from '../../domain/entry/EntryErrors';

export class GetEntry {
  constructor(private readonly entries: EntryRepository) {}

  async execute(id: string): Promise<Entry> {
    const entry = await this.entries.findById(id);
    if (!entry) throw new EntryNotFound(id);
    return entry;
  }
}

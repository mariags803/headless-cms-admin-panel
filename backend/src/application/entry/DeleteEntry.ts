import type { EntryRepository } from '../../domain/entry/EntryRepository';
import { EntryNotFound } from '../../domain/entry/EntryErrors';

export class DeleteEntry {
  constructor(private readonly entries: EntryRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.entries.findById(id);
    if (!existing) throw new EntryNotFound(id);
    await this.entries.delete(id);
  }
}

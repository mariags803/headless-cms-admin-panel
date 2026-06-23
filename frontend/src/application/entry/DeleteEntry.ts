import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class DeleteEntry {
  private readonly entries: EntryRepository;

  constructor(entries: EntryRepository) {
    this.entries = entries;
  }

  execute(id: string): Promise<void> {
    return this.entries.delete(id);
  }
}

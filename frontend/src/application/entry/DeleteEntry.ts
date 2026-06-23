import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class DeleteEntry {
  constructor(private readonly entries: EntryRepository) {}

  execute(id: string): Promise<void> {
    return this.entries.delete(id);
  }
}

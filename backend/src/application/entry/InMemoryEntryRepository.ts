import type { Entry } from '../../domain/entry/Entry';
import type { EntryRepository } from '../../domain/entry/EntryRepository';

export class InMemoryEntryRepository implements EntryRepository {
  private readonly store = new Map<string, Entry>();

  async findBySchemaId(schemaId: string): Promise<Entry[]> {
    return [...this.store.values()].filter((entry) => entry.schemaId === schemaId);
  }

  async findById(id: string): Promise<Entry | null> {
    return this.store.get(id) ?? null;
  }

  async save(entry: Entry): Promise<void> {
    this.store.set(entry.id, entry);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

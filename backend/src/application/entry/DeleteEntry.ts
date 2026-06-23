import type { EntryRepository } from '../../domain/entry/EntryRepository';
import { EntryNotFound } from '../../domain/entry/EntryErrors';
import type { EventPublisher } from '../ports/EventPublisher';

export class DeleteEntry {
  constructor(
    private readonly entries: EntryRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.entries.findById(id);
    if (!existing) throw new EntryNotFound(id);
    await this.entries.delete(id);
    this.publisher.publish({ type: 'entry.deleted', entryId: id, schemaId: existing.schemaId });
  }
}

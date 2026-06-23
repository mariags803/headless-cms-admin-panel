import type { Entry } from '@cms/shared';
import type { EntryRepository, EntryUpdateInput, NewEntryInput } from '../../domain/entry/EntryRepository';

const DEFAULT_BASE_URL = 'http://localhost:3001';

export class HttpEntryRepository implements EntryRepository {
  constructor(private readonly baseUrl: string = DEFAULT_BASE_URL) {}

  async findAllBySchema(schemaId: string): Promise<Entry[]> {
    const res = await fetch(`${this.baseUrl}/entries?schema=${encodeURIComponent(schemaId)}`);
    return res.json();
  }

  async findById(id: string): Promise<Entry | null> {
    const res = await fetch(`${this.baseUrl}/entries/${id}`);
    if (res.status === 404) return null;
    return res.json();
  }

  async create(input: NewEntryInput): Promise<Entry> {
    const res = await fetch(`${this.baseUrl}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async update(id: string, input: EntryUpdateInput): Promise<Entry> {
    const res = await fetch(`${this.baseUrl}/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/entries/${id}`, { method: 'DELETE' });
  }
}

import type { Entry, FieldValue } from '@cms/shared';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import { ListEntries } from './ListEntries';
import { GetEntry } from './GetEntry';
import { CreateEntry } from './CreateEntry';
import { UpdateEntry } from './UpdateEntry';
import { DeleteEntry } from './DeleteEntry';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'e1',
    schemaId: 's1',
    data: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

class FakeEntryRepository implements EntryRepository {
  private store = new Map<string, Entry>();

  seed(entry: Entry) {
    this.store.set(entry.id, entry);
  }

  async findAllBySchema(schemaId: string) {
    return [...this.store.values()].filter((e) => e.schemaId === schemaId);
  }

  async findById(id: string) {
    return this.store.get(id) ?? null;
  }

  async create(input: { schemaId: string; data: Record<string, FieldValue> }) {
    const entry = makeEntry({ id: 'new-id', ...input });
    this.store.set(entry.id, entry);
    return entry;
  }

  async update(id: string, input: { data: Record<string, FieldValue> }) {
    const updated = makeEntry({ ...this.store.get(id), id, ...input });
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    this.store.delete(id);
  }
}

describe('entry use cases', () => {
  it('ListEntries returns entries for the given schema only', async () => {
    const repo = new FakeEntryRepository();
    repo.seed(makeEntry());
    repo.seed(makeEntry({ id: 'e2', schemaId: 's2' }));

    const result = await new ListEntries(repo).execute('s1');

    expect(result).toEqual([makeEntry()]);
  });

  it('GetEntry returns the entry by id, or null', async () => {
    const repo = new FakeEntryRepository();
    repo.seed(makeEntry());

    expect(await new GetEntry(repo).execute('e1')).toEqual(makeEntry());
    expect(await new GetEntry(repo).execute('missing')).toBeNull();
  });

  it('CreateEntry delegates to repository.create', async () => {
    const repo = new FakeEntryRepository();

    const result = await new CreateEntry(repo).execute({ schemaId: 's1', data: { f1: 'x' } });

    expect(result.schemaId).toBe('s1');
    expect(await repo.findById(result.id)).toEqual(result);
  });

  it('UpdateEntry delegates to repository.update', async () => {
    const repo = new FakeEntryRepository();
    repo.seed(makeEntry());

    const result = await new UpdateEntry(repo).execute('e1', { data: { f1: 'y' } });

    expect(result.data).toEqual({ f1: 'y' });
  });

  it('DeleteEntry delegates to repository.delete', async () => {
    const repo = new FakeEntryRepository();
    repo.seed(makeEntry());

    await new DeleteEntry(repo).execute('e1');

    expect(await repo.findById('e1')).toBeNull();
  });
});

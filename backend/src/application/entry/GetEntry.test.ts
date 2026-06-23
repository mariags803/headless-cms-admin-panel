import { GetEntry } from './GetEntry';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';
import { EntryNotFound } from '../../domain/entry/EntryErrors';

describe('GetEntry', () => {
  it('returns the entry when found', async () => {
    const repo = new InMemoryEntryRepository();
    await repo.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 't', updatedAt: 't' });

    const result = await new GetEntry(repo).execute('e1');

    expect(result.id).toBe('e1');
  });

  it('throws EntryNotFound for an unknown id', async () => {
    const repo = new InMemoryEntryRepository();

    await expect(new GetEntry(repo).execute('does-not-exist')).rejects.toBeInstanceOf(EntryNotFound);
  });
});

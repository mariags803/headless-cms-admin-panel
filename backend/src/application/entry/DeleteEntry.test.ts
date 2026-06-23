import { DeleteEntry } from './DeleteEntry';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';
import { EntryNotFound } from '../../domain/entry/EntryErrors';

describe('DeleteEntry', () => {
  it('removes an existing entry', async () => {
    const repo = new InMemoryEntryRepository();
    await repo.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 't', updatedAt: 't' });

    await new DeleteEntry(repo).execute('e1');

    expect(await repo.findById('e1')).toBeNull();
  });

  it('throws EntryNotFound for an unknown id', async () => {
    const repo = new InMemoryEntryRepository();

    await expect(new DeleteEntry(repo).execute('does-not-exist')).rejects.toBeInstanceOf(EntryNotFound);
  });
});

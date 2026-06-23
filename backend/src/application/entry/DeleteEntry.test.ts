import { DeleteEntry } from './DeleteEntry';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { EntryNotFound } from '../../domain/entry/EntryErrors';

describe('DeleteEntry', () => {
  it('removes an existing entry', async () => {
    const repo = new InMemoryEntryRepository();
    await repo.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 't', updatedAt: 't' });

    await new DeleteEntry(repo, new InMemoryEventPublisher()).execute('e1');

    expect(await repo.findById('e1')).toBeNull();
  });

  it('publishes an entry.deleted event', async () => {
    const repo = new InMemoryEntryRepository();
    await repo.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 't', updatedAt: 't' });
    const publisher = new InMemoryEventPublisher();

    await new DeleteEntry(repo, publisher).execute('e1');

    expect(publisher.events).toEqual([{ type: 'entry.deleted', entryId: 'e1', schemaId: 's1' }]);
  });

  it('throws EntryNotFound for an unknown id', async () => {
    const repo = new InMemoryEntryRepository();

    await expect(
      new DeleteEntry(repo, new InMemoryEventPublisher()).execute('does-not-exist'),
    ).rejects.toBeInstanceOf(EntryNotFound);
  });
});

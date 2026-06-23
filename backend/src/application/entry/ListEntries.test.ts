import { ListEntries } from './ListEntries';
import { InMemoryEntryRepository } from './InMemoryEntryRepository';

describe('ListEntries', () => {
  it('returns [] when no entries exist for the schema', async () => {
    const repo = new InMemoryEntryRepository();
    const useCase = new ListEntries(repo);

    expect(await useCase.execute('s1')).toEqual([]);
  });

  it('returns only entries belonging to the given schema', async () => {
    const repo = new InMemoryEntryRepository();
    await repo.save({ id: 'e1', schemaId: 's1', data: {}, createdAt: 't', updatedAt: 't' });
    await repo.save({ id: 'e2', schemaId: 's2', data: {}, createdAt: 't', updatedAt: 't' });

    const result = await new ListEntries(repo).execute('s1');

    expect(result.map((e) => e.id)).toEqual(['e1']);
  });
});

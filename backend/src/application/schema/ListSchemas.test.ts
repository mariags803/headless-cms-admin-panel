import { ListSchemas } from './ListSchemas';
import { CreateSchema } from './CreateSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';

describe('ListSchemas', () => {
  it('returns [] when the repository is empty', async () => {
    const repo = new InMemorySchemaRepository();
    const useCase = new ListSchemas(repo);

    expect(await useCase.execute()).toEqual([]);
  });

  it('returns all saved schemas', async () => {
    const repo = new InMemorySchemaRepository();
    const create = new CreateSchema(repo);
    await create.execute({ name: 'Car', fields: [] });
    await create.execute({ name: 'Person', fields: [] });

    const result = await new ListSchemas(repo).execute();

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.name).sort()).toEqual(['Car', 'Person']);
  });
});

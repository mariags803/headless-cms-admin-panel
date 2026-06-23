import { CreateSchema } from './CreateSchema';
import { DeleteSchema } from './DeleteSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';

describe('DeleteSchema', () => {
  it('removes an existing schema', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo).execute({ name: 'Car', fields: [] });

    await new DeleteSchema(repo).execute(created.id);

    expect(await repo.findById(created.id)).toBeNull();
  });

  it('throws SchemaNotFound for an unknown id', async () => {
    const repo = new InMemorySchemaRepository();

    await expect(new DeleteSchema(repo).execute('does-not-exist')).rejects.toBeInstanceOf(SchemaNotFound);
  });
});

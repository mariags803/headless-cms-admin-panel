import { CreateSchema } from './CreateSchema';
import { DeleteSchema } from './DeleteSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';

describe('DeleteSchema', () => {
  it('removes an existing schema', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    await new DeleteSchema(repo, new InMemoryEventPublisher()).execute(created.id);

    expect(await repo.findById(created.id)).toBeNull();
  });

  it('publishes a schema.deleted event', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });
    const publisher = new InMemoryEventPublisher();

    await new DeleteSchema(repo, publisher).execute(created.id);

    expect(publisher.events).toEqual([{ type: 'schema.deleted', schemaId: created.id }]);
  });

  it('throws SchemaNotFound for an unknown id', async () => {
    const repo = new InMemorySchemaRepository();

    await expect(
      new DeleteSchema(repo, new InMemoryEventPublisher()).execute('does-not-exist'),
    ).rejects.toBeInstanceOf(SchemaNotFound);
  });
});

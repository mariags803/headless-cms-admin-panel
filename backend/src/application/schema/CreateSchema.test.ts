import { CreateSchema } from './CreateSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { InvalidSchema } from '../../domain/schema/SchemaErrors';

describe('CreateSchema', () => {
  it('creates a schema with generated id and matching createdAt/updatedAt', async () => {
    const repo = new InMemorySchemaRepository();
    const publisher = new InMemoryEventPublisher();
    const useCase = new CreateSchema(repo, publisher);

    const schema = await useCase.execute({
      name: 'Car',
      fields: [{ id: 'f1', name: 'brand', type: 'text', required: true }],
    });

    expect(schema.id).toBeTruthy();
    expect(schema.createdAt).toBe(schema.updatedAt);
    expect(await repo.findById(schema.id)).toEqual(schema);
  });

  it('publishes a schema.created event', async () => {
    const repo = new InMemorySchemaRepository();
    const publisher = new InMemoryEventPublisher();
    const useCase = new CreateSchema(repo, publisher);

    const schema = await useCase.execute({ name: 'Car', fields: [] });

    expect(publisher.events).toEqual([{ type: 'schema.created', schema }]);
  });

  it('defaults fields to [] when omitted', async () => {
    const repo = new InMemorySchemaRepository();
    const useCase = new CreateSchema(repo, new InMemoryEventPublisher());

    const schema = await useCase.execute({ name: 'Car' } as never);

    expect(schema.fields).toEqual([]);
  });

  it('rejects an empty name', async () => {
    const repo = new InMemorySchemaRepository();
    const useCase = new CreateSchema(repo, new InMemoryEventPublisher());

    await expect(useCase.execute({ name: '  ', fields: [] })).rejects.toBeInstanceOf(InvalidSchema);
  });

  it('rejects a field with an invalid type', async () => {
    const repo = new InMemorySchemaRepository();
    const useCase = new CreateSchema(repo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({
        name: 'Car',
        fields: [{ id: 'f1', name: 'brand', type: 'invalid' as never, required: true }],
      }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });

  it('rejects a reference field missing refSchemaId', async () => {
    const repo = new InMemorySchemaRepository();
    const useCase = new CreateSchema(repo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({
        name: 'Car',
        fields: [{ id: 'f1', name: 'owner', type: 'reference', required: false }],
      }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });

  it('rejects duplicate field ids', async () => {
    const repo = new InMemorySchemaRepository();
    const useCase = new CreateSchema(repo, new InMemoryEventPublisher());

    await expect(
      useCase.execute({
        name: 'Car',
        fields: [
          { id: 'f1', name: 'brand', type: 'text', required: true },
          { id: 'f1', name: 'model', type: 'text', required: true },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });
});

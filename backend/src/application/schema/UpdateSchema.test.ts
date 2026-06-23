import { CreateSchema } from './CreateSchema';
import { UpdateSchema } from './UpdateSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { SchemaNotFound, InvalidSchema } from '../../domain/schema/SchemaErrors';

describe('UpdateSchema', () => {
  it('updates name and fields, bumps updatedAt, preserves id and createdAt', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    const updated = await new UpdateSchema(repo, new InMemoryEventPublisher()).execute({
      id: created.id,
      name: 'Car (used)',
      fields: [{ id: 'f1', name: 'brand', type: 'text', required: true }],
    });

    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.name).toBe('Car (used)');
    expect(updated.fields).toHaveLength(1);
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
  });

  it('publishes a schema.updated event', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });
    const publisher = new InMemoryEventPublisher();

    const updated = await new UpdateSchema(repo, publisher).execute({ id: created.id, name: 'Car (used)', fields: [] });

    expect(publisher.events).toEqual([{ type: 'schema.updated', schema: updated }]);
  });

  it('throws SchemaNotFound for an unknown id', async () => {
    const repo = new InMemorySchemaRepository();

    await expect(
      new UpdateSchema(repo, new InMemoryEventPublisher()).execute({ id: 'does-not-exist', name: 'X', fields: [] }),
    ).rejects.toBeInstanceOf(SchemaNotFound);
  });

  it('throws InvalidSchema for an empty name', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    await expect(
      new UpdateSchema(repo, new InMemoryEventPublisher()).execute({ id: created.id, name: '  ', fields: [] }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });

  it('generates an id for a newly added field with none', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    const updated = await new UpdateSchema(repo, new InMemoryEventPublisher()).execute({
      id: created.id,
      name: 'Car',
      fields: [{ name: 'brand', type: 'text', required: true } as never],
    });

    expect(updated.fields[0].id).toBeTruthy();
  });

  it('preserves an existing field id across an update (rename-safety)', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'brand', type: 'text', required: true } as never],
    });
    const fieldId = created.fields[0].id;

    const updated = await new UpdateSchema(repo, new InMemoryEventPublisher()).execute({
      id: created.id,
      name: 'Car',
      fields: [{ id: fieldId, name: 'manufacturer', type: 'text', required: true }],
    });

    expect(updated.fields[0].id).toBe(fieldId);
    expect(updated.fields[0].name).toBe('manufacturer');
  });

  it('rejects duplicate field ids', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    await expect(
      new UpdateSchema(repo, new InMemoryEventPublisher()).execute({
        id: created.id,
        name: 'Car',
        fields: [
          { id: 'f1', name: 'brand', type: 'text', required: true },
          { id: 'f1', name: 'model', type: 'text', required: true },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });
});

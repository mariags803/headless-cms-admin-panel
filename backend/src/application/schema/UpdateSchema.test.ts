import { CreateSchema } from './CreateSchema';
import { UpdateSchema } from './UpdateSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { InMemoryEntryRepository } from '../entry/InMemoryEntryRepository';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import { EvolutionBlocked, SchemaNotFound, InvalidSchema } from '../../domain/schema/SchemaErrors';

describe('UpdateSchema', () => {
  it('updates name and fields, bumps updatedAt, preserves id and createdAt', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    const updated = await new UpdateSchema(repo, new InMemoryEntryRepository(), new InMemoryEventPublisher()).execute({
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

    const updated = await new UpdateSchema(repo, new InMemoryEntryRepository(), publisher).execute({
      id: created.id,
      name: 'Car (used)',
      fields: [],
    });

    expect(publisher.events).toEqual([{ type: 'schema.updated', schema: updated }]);
  });

  it('throws SchemaNotFound for an unknown id', async () => {
    const repo = new InMemorySchemaRepository();

    await expect(
      new UpdateSchema(repo, new InMemoryEntryRepository(), new InMemoryEventPublisher()).execute({
        id: 'does-not-exist',
        name: 'X',
        fields: [],
      }),
    ).rejects.toBeInstanceOf(SchemaNotFound);
  });

  it('throws InvalidSchema for an empty name', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    await expect(
      new UpdateSchema(repo, new InMemoryEntryRepository(), new InMemoryEventPublisher()).execute({
        id: created.id,
        name: '  ',
        fields: [],
      }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });

  it('generates an id for a newly added field with none', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({ name: 'Car', fields: [] });

    const updated = await new UpdateSchema(repo, new InMemoryEntryRepository(), new InMemoryEventPublisher()).execute({
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

    const updated = await new UpdateSchema(repo, new InMemoryEntryRepository(), new InMemoryEventPublisher()).execute({
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
      new UpdateSchema(repo, new InMemoryEntryRepository(), new InMemoryEventPublisher()).execute({
        id: created.id,
        name: 'Car',
        fields: [
          { id: 'f1', name: 'brand', type: 'text', required: true },
          { id: 'f1', name: 'model', type: 'text', required: true },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });

  it('rejects a retype when an affected entry value cannot be coerced', async () => {
    const repo = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'year', type: 'text', required: false } as never],
    });
    const fieldId = created.fields[0].id;
    await entries.save({
      id: 'e1',
      schemaId: created.id,
      data: { [fieldId]: 'vintage' },
      createdAt: 'now',
      updatedAt: 'now',
    });

    await expect(
      new UpdateSchema(repo, entries, new InMemoryEventPublisher()).execute({
        id: created.id,
        name: 'Car',
        fields: [{ id: fieldId, name: 'year', type: 'number', required: false }],
      }),
    ).rejects.toBeInstanceOf(EvolutionBlocked);
  });

  it('accepts a retype once the affected entry was already fixed', async () => {
    const repo = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    const created = await new CreateSchema(repo, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'year', type: 'text', required: false } as never],
    });
    const fieldId = created.fields[0].id;
    await entries.save({
      id: 'e1',
      schemaId: created.id,
      data: { [fieldId]: '2024' },
      createdAt: 'now',
      updatedAt: 'now',
    });

    const updated = await new UpdateSchema(repo, entries, new InMemoryEventPublisher()).execute({
      id: created.id,
      name: 'Car',
      fields: [{ id: fieldId, name: 'year', type: 'number', required: false }],
    });

    expect(updated.fields[0].type).toBe('number');
  });
});

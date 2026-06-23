import { CreateSchema } from './CreateSchema';
import { UpdateSchema } from './UpdateSchema';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { SchemaNotFound, InvalidSchema } from '../../domain/schema/SchemaErrors';

describe('UpdateSchema', () => {
  it('updates name and fields, bumps updatedAt, preserves id and createdAt', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo).execute({ name: 'Car', fields: [] });

    const updated = await new UpdateSchema(repo).execute({
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

  it('throws SchemaNotFound for an unknown id', async () => {
    const repo = new InMemorySchemaRepository();

    await expect(
      new UpdateSchema(repo).execute({ id: 'does-not-exist', name: 'X', fields: [] }),
    ).rejects.toBeInstanceOf(SchemaNotFound);
  });

  it('throws InvalidSchema for an empty name', async () => {
    const repo = new InMemorySchemaRepository();
    const created = await new CreateSchema(repo).execute({ name: 'Car', fields: [] });

    await expect(
      new UpdateSchema(repo).execute({ id: created.id, name: '  ', fields: [] }),
    ).rejects.toBeInstanceOf(InvalidSchema);
  });
});

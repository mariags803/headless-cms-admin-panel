import type { Field, Schema } from '@cms/shared';
import type { ApplyEvolutionInput, SchemaRepository } from '../../domain/schema/SchemaRepository';
import { ListSchemas } from './ListSchemas';
import { GetSchema } from './GetSchema';
import { CreateSchema } from './CreateSchema';
import { UpdateSchema } from './UpdateSchema';
import { ApplyEvolution } from './ApplyEvolution';
import { DeleteSchema } from './DeleteSchema';

function makeSchema(overrides: Partial<Schema> = {}): Schema {
  return {
    id: 's1',
    name: 'Car',
    fields: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

class FakeSchemaRepository implements SchemaRepository {
  private store = new Map<string, Schema>();

  seed(schema: Schema) {
    this.store.set(schema.id, schema);
  }

  async findAll() {
    return [...this.store.values()];
  }

  async findById(id: string) {
    return this.store.get(id) ?? null;
  }

  async create(input: { name: string; fields: Schema['fields'] }) {
    const schema = makeSchema({ id: 'new-id', ...input });
    this.store.set(schema.id, schema);
    return schema;
  }

  async update(id: string, input: { name: string; fields: Schema['fields'] }) {
    const updated = makeSchema({ ...this.store.get(id), id, ...input });
    this.store.set(id, updated);
    return updated;
  }

  lastApplyEvolutionInput: { id: string; input: ApplyEvolutionInput } | null = null;

  async applyEvolution(id: string, input: ApplyEvolutionInput) {
    this.lastApplyEvolutionInput = { id, input };
    const fields: Field[] = input.newSchema.fields.map((field, index) => ({
      ...field,
      id: field.id ?? `generated-${index}`,
    }));
    const updated = makeSchema({ ...this.store.get(id), id, name: input.newSchema.name, fields });
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    this.store.delete(id);
  }
}

describe('schema use cases', () => {
  it('ListSchemas returns all schemas from the repository', async () => {
    const repo = new FakeSchemaRepository();
    repo.seed(makeSchema());

    const result = await new ListSchemas(repo).execute();

    expect(result).toEqual([makeSchema()]);
  });

  it('GetSchema returns the schema by id, or null', async () => {
    const repo = new FakeSchemaRepository();
    repo.seed(makeSchema());

    expect(await new GetSchema(repo).execute('s1')).toEqual(makeSchema());
    expect(await new GetSchema(repo).execute('missing')).toBeNull();
  });

  it('CreateSchema delegates to repository.create', async () => {
    const repo = new FakeSchemaRepository();

    const result = await new CreateSchema(repo).execute({ name: 'Car', fields: [] });

    expect(result.name).toBe('Car');
    expect(await repo.findById(result.id)).toEqual(result);
  });

  it('UpdateSchema delegates to repository.update', async () => {
    const repo = new FakeSchemaRepository();
    repo.seed(makeSchema());

    const result = await new UpdateSchema(repo).execute('s1', { name: 'Vehicle', fields: [] });

    expect(result.name).toBe('Vehicle');
  });

  it('ApplyEvolution delegates to repository.applyEvolution', async () => {
    const repo = new FakeSchemaRepository();
    repo.seed(makeSchema());

    const result = await new ApplyEvolution(repo).execute('s1', {
      newSchema: { name: 'Vehicle', fields: [] },
      corrections: [{ entryId: 'e1', fieldId: 'f1', value: 2024 }],
    });

    expect(result.name).toBe('Vehicle');
    expect(repo.lastApplyEvolutionInput).toEqual({
      id: 's1',
      input: { newSchema: { name: 'Vehicle', fields: [] }, corrections: [{ entryId: 'e1', fieldId: 'f1', value: 2024 }] },
    });
  });

  it('DeleteSchema delegates to repository.delete', async () => {
    const repo = new FakeSchemaRepository();
    repo.seed(makeSchema());

    await new DeleteSchema(repo).execute('s1');

    expect(await repo.findById('s1')).toBeNull();
  });
});

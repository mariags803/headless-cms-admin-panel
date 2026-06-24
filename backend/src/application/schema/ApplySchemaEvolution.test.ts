import { CreateSchema } from './CreateSchema';
import { ApplySchemaEvolution } from './ApplySchemaEvolution';
import { InMemorySchemaRepository } from './InMemorySchemaRepository';
import { InMemoryEntryRepository } from '../entry/InMemoryEntryRepository';
import { InMemoryEventPublisher } from '../events/InMemoryEventPublisher';
import type { TransactionRunner } from '../ports/TransactionRunner';
import { EvolutionBlocked, SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { EntryNotFound, InvalidEntry } from '../../domain/entry/EntryErrors';

function passthroughRunner(): TransactionRunner {
  return { run: (fn) => fn() };
}

describe('ApplySchemaEvolution', () => {
  it('applies a correction that fails the old type but fits the new one, then updates the schema', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    const created = await new CreateSchema(schemas, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'year', type: 'text', required: false } as never],
    });
    const fieldId = created.fields[0].id;
    await entries.save({ id: 'e1', schemaId: created.id, data: { [fieldId]: 'vintage' }, createdAt: 'now', updatedAt: 'now' });

    const publisher = new InMemoryEventPublisher();
    const updated = await new ApplySchemaEvolution(schemas, entries, publisher, passthroughRunner()).execute({
      id: created.id,
      newSchema: { name: 'Car', fields: [{ id: fieldId, name: 'year', type: 'number', required: false }] },
      corrections: [{ entryId: 'e1', fieldId, value: 2024 }],
    });

    expect(updated.fields[0].type).toBe('number');
    const fixedEntry = await entries.findById('e1');
    expect(fixedEntry?.data[fieldId]).toBe(2024);
    expect(publisher.events).toEqual([
      { type: 'entry.updated', entry: fixedEntry },
      { type: 'schema.updated', schema: updated },
    ]);
  });

  it('throws InvalidEntry when a corrected value is still empty for a required field', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    const created = await new CreateSchema(schemas, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'brand', type: 'text', required: false } as never],
    });
    const fieldId = created.fields[0].id;
    await entries.save({ id: 'e1', schemaId: created.id, data: {}, createdAt: 'now', updatedAt: 'now' });

    await expect(
      new ApplySchemaEvolution(schemas, entries, new InMemoryEventPublisher(), passthroughRunner()).execute({
        id: created.id,
        newSchema: { name: 'Car', fields: [{ id: fieldId, name: 'brand', type: 'text', required: true }] },
        corrections: [{ entryId: 'e1', fieldId, value: '' }],
      }),
    ).rejects.toBeInstanceOf(InvalidEntry);
  });

  it('throws EvolutionBlocked when an uncorrected entry is still not coercible', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    const created = await new CreateSchema(schemas, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'year', type: 'text', required: false } as never],
    });
    const fieldId = created.fields[0].id;
    await entries.save({ id: 'e1', schemaId: created.id, data: { [fieldId]: 'vintage' }, createdAt: 'now', updatedAt: 'now' });

    await expect(
      new ApplySchemaEvolution(schemas, entries, new InMemoryEventPublisher(), passthroughRunner()).execute({
        id: created.id,
        newSchema: { name: 'Car', fields: [{ id: fieldId, name: 'year', type: 'number', required: false }] },
        corrections: [],
      }),
    ).rejects.toBeInstanceOf(EvolutionBlocked);

    const untouched = await schemas.findById(created.id);
    expect(untouched?.fields[0].type).toBe('text');
  });

  it('throws SchemaNotFound for an unknown id', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();

    await expect(
      new ApplySchemaEvolution(schemas, entries, new InMemoryEventPublisher(), passthroughRunner()).execute({
        id: 'does-not-exist',
        newSchema: { name: 'Car', fields: [] },
        corrections: [],
      }),
    ).rejects.toBeInstanceOf(SchemaNotFound);
  });

  it('throws EntryNotFound when a correction targets a missing entry', async () => {
    const schemas = new InMemorySchemaRepository();
    const entries = new InMemoryEntryRepository();
    const created = await new CreateSchema(schemas, new InMemoryEventPublisher()).execute({
      name: 'Car',
      fields: [{ name: 'year', type: 'text', required: false } as never],
    });
    const fieldId = created.fields[0].id;

    await expect(
      new ApplySchemaEvolution(schemas, entries, new InMemoryEventPublisher(), passthroughRunner()).execute({
        id: created.id,
        newSchema: { name: 'Car', fields: [{ id: fieldId, name: 'year', type: 'number', required: false }] },
        corrections: [{ entryId: 'missing', fieldId, value: 2024 }],
      }),
    ).rejects.toBeInstanceOf(EntryNotFound);
  });
});

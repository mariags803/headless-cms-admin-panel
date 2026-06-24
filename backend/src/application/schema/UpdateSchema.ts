import { randomUUID } from 'node:crypto';
import type { Field, Schema } from '@cms/shared';
import { diffSchemas, scanAffected } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import { EvolutionBlocked, InvalidSchema, SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { validateSchemaInput, type FieldInput } from './validateSchemaInput';
import type { EventPublisher } from '../ports/EventPublisher';

export interface UpdateSchemaInput {
  id: string;
  name: string;
  fields: FieldInput[];
}

export class UpdateSchema {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly entries: EntryRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(input: UpdateSchemaInput): Promise<Schema> {
    const existing = await this.schemas.findById(input.id);
    if (!existing) throw new SchemaNotFound(input.id);

    // existing fields echo back their id (kept stable for rename-safety);
    // newly added fields arrive without one and get generated here.
    const fields: Field[] = input.fields.map((field) => ({ ...field, id: field.id ?? randomUUID() }));
    const errors = validateSchemaInput({ name: input.name, fields });
    if (errors.length) throw new InvalidSchema(errors);

    const updated: Schema = {
      ...existing,
      name: input.name,
      fields,
      updatedAt: new Date().toISOString(),
    };

    // Safety net: the client preview is expected to fix entries before applying,
    // but re-run the same shared pipeline here so an apply can never persist an
    // entry value that the preview marked as non-coercible.
    const entriesOfSchema = await this.entries.findBySchemaId(existing.id);
    const changes = diffSchemas(existing, updated);
    const affected = scanAffected(changes, entriesOfSchema);
    const unresolved = affected.filter((row) => row.coerced && !row.coerced.ok);
    if (unresolved.length > 0) {
      throw new EvolutionBlocked(unresolved.map(({ entryId, fieldId }) => ({ entryId, fieldId })));
    }

    await this.schemas.save(updated);
    this.publisher.publish({ type: 'schema.updated', schema: updated });
    return updated;
  }
}

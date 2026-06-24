import { randomUUID } from 'node:crypto';
import { diffSchemas, scanAffected, validateEntry, type Field, type FieldValue, type Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import type { EntryRepository } from '../../domain/entry/EntryRepository';
import { EvolutionBlocked, InvalidSchema, SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { EntryNotFound, InvalidEntry } from '../../domain/entry/EntryErrors';
import { validateSchemaInput, type FieldInput } from './validateSchemaInput';
import type { EventPublisher } from '../ports/EventPublisher';
import type { TransactionRunner } from '../ports/TransactionRunner';

export interface EvolutionCorrection {
  entryId: string;
  fieldId: string;
  value: FieldValue;
}

export interface ApplySchemaEvolutionInput {
  id: string;
  newSchema: { name: string; fields: FieldInput[] };
  corrections: EvolutionCorrection[];
}

export class ApplySchemaEvolution {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly entries: EntryRepository,
    private readonly publisher: EventPublisher,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(input: ApplySchemaEvolutionInput): Promise<Schema> {
    const existing = await this.schemas.findById(input.id);
    if (!existing) throw new SchemaNotFound(input.id);

    const fields: Field[] = input.newSchema.fields.map((field) => ({
      ...field,
      id: field.id ?? randomUUID(),
    }));
    const errors = validateSchemaInput({ name: input.newSchema.name, fields });
    if (errors.length) throw new InvalidSchema(errors);

    const updated: Schema = {
      ...existing,
      name: input.newSchema.name,
      fields,
      updatedAt: new Date().toISOString(),
    };

    return this.transactions.run(async () => {
      for (const { entryId, fieldId, value } of input.corrections) {
        const entry = await this.entries.findById(entryId);
        if (!entry) throw new EntryNotFound(entryId);

        const mergedData = { ...entry.data, [fieldId]: value };
        const validationErrors = validateEntry(mergedData, updated, { skipTypeCheck: true });
        if (validationErrors.length) throw new InvalidEntry(validationErrors);

        const savedEntry = { ...entry, data: mergedData, updatedAt: new Date().toISOString() };
        await this.entries.save(savedEntry);
        this.publisher.publish({ type: 'entry.updated', entry: savedEntry });
      }

      // Safety net: re-run the same shared pipeline as UpdateSchema so an apply can
      // never persist an entry value that's still non-coercible after corrections.
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
    });
  }
}

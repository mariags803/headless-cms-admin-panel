import type { Field, Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { InvalidSchema, SchemaNotFound } from '../../domain/schema/SchemaErrors';
import { validateSchemaInput } from './validateSchemaInput';
import type { EventPublisher } from '../ports/EventPublisher';

export interface UpdateSchemaInput {
  id: string;
  name: string;
  fields: Field[];
}

export class UpdateSchema {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly publisher: EventPublisher,
  ) {}

  // Plain replace of name/fields — no evolution-risk classification here.
  // That belongs to Phase 6 (shared/evolution), layered on top later.
  async execute(input: UpdateSchemaInput): Promise<Schema> {
    const existing = await this.schemas.findById(input.id);
    if (!existing) throw new SchemaNotFound(input.id);

    const errors = validateSchemaInput({ name: input.name, fields: input.fields });
    if (errors.length) throw new InvalidSchema(errors);

    const updated: Schema = {
      ...existing,
      name: input.name,
      fields: input.fields,
      updatedAt: new Date().toISOString(),
    };

    await this.schemas.save(updated);
    this.publisher.publish({ type: 'schema.updated', schema: updated });
    return updated;
  }
}

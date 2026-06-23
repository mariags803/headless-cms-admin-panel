import { randomUUID } from 'node:crypto';
import type { Field, Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { InvalidSchema } from '../../domain/schema/SchemaErrors';
import { validateSchemaInput, type FieldInput } from './validateSchemaInput';
import type { EventPublisher } from '../ports/EventPublisher';

export interface NewSchemaInput {
  name: string;
  fields?: FieldInput[];
}

export class CreateSchema {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(input: NewSchemaInput): Promise<Schema> {
    // every field is new on creation — id is always server-generated, never trusted from the client.
    const fields: Field[] = (input.fields ?? []).map((field) => ({ ...field, id: randomUUID() }));
    const errors = validateSchemaInput({ name: input.name, fields });
    if (errors.length) throw new InvalidSchema(errors);

    const now = new Date().toISOString();
    const schema: Schema = {
      id: randomUUID(),
      name: input.name,
      fields,
      createdAt: now,
      updatedAt: now,
    };

    await this.schemas.save(schema);
    this.publisher.publish({ type: 'schema.created', schema });
    return schema;
  }
}

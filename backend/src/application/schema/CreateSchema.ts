import { randomUUID } from 'node:crypto';
import type { Field, Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { InvalidSchema } from '../../domain/schema/SchemaErrors';
import { validateSchemaInput } from './validateSchemaInput';

export interface NewSchemaInput {
  name: string;
  fields?: Field[];
}

export class CreateSchema {
  constructor(private readonly schemas: SchemaRepository) {}

  async execute(input: NewSchemaInput): Promise<Schema> {
    const fields = input.fields ?? [];
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
    return schema;
  }
}

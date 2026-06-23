import type { Schema } from '@cms/shared';
import type { NewSchemaInput, SchemaRepository } from '../../domain/schema/SchemaRepository';

export class CreateSchema {
  constructor(private readonly schemas: SchemaRepository) {}

  execute(input: NewSchemaInput): Promise<Schema> {
    return this.schemas.create(input);
  }
}

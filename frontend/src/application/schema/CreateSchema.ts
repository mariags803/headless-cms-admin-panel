import type { Schema } from '@cms/shared';
import type { NewSchemaInput, SchemaRepository } from '../../domain/schema/SchemaRepository';

export class CreateSchema {
  private readonly schemas: SchemaRepository;

  constructor(schemas: SchemaRepository) {
    this.schemas = schemas;
  }

  execute(input: NewSchemaInput): Promise<Schema> {
    return this.schemas.create(input);
  }
}

import type { Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class ListSchemas {
  private readonly schemas: SchemaRepository;

  constructor(schemas: SchemaRepository) {
    this.schemas = schemas;
  }

  execute(): Promise<Schema[]> {
    return this.schemas.findAll();
  }
}

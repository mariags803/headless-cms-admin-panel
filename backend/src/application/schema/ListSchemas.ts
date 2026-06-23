import type { Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class ListSchemas {
  constructor(private readonly schemas: SchemaRepository) {}

  async execute(): Promise<Schema[]> {
    return this.schemas.findAll();
  }
}

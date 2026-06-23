import type { Schema } from '@cms/shared';
import type { SchemaRepository, SchemaUpdateInput } from '../../domain/schema/SchemaRepository';

export class UpdateSchema {
  private readonly schemas: SchemaRepository;

  constructor(schemas: SchemaRepository) {
    this.schemas = schemas;
  }

  execute(id: string, input: SchemaUpdateInput): Promise<Schema> {
    return this.schemas.update(id, input);
  }
}

import type { Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class GetSchema {
  private readonly schemas: SchemaRepository;

  constructor(schemas: SchemaRepository) {
    this.schemas = schemas;
  }

  execute(id: string): Promise<Schema | null> {
    return this.schemas.findById(id);
  }
}

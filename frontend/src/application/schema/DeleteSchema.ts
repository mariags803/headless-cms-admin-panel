import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class DeleteSchema {
  private readonly schemas: SchemaRepository;

  constructor(schemas: SchemaRepository) {
    this.schemas = schemas;
  }

  execute(id: string): Promise<void> {
    return this.schemas.delete(id);
  }
}

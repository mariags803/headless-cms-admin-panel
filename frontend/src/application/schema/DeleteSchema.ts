import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class DeleteSchema {
  constructor(private readonly schemas: SchemaRepository) {}

  execute(id: string): Promise<void> {
    return this.schemas.delete(id);
  }
}

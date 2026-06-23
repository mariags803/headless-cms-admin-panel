import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';

export class DeleteSchema {
  constructor(private readonly schemas: SchemaRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.schemas.findById(id);
    if (!existing) throw new SchemaNotFound(id);
    await this.schemas.delete(id);
  }
}

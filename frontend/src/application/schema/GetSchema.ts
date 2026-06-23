import type { Schema } from '@cms/shared';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class GetSchema {
  constructor(private readonly schemas: SchemaRepository) {}

  execute(id: string): Promise<Schema | null> {
    return this.schemas.findById(id);
  }
}

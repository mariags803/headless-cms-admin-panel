import type { Schema } from '@cms/shared';
import type { SchemaRepository, SchemaUpdateInput } from '../../domain/schema/SchemaRepository';

export class UpdateSchema {
  constructor(private readonly schemas: SchemaRepository) {}

  execute(id: string, input: SchemaUpdateInput): Promise<Schema> {
    return this.schemas.update(id, input);
  }
}

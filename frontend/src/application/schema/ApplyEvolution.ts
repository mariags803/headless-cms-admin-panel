import type { Schema } from '@cms/shared';
import type { ApplyEvolutionInput, SchemaRepository } from '../../domain/schema/SchemaRepository';

export class ApplyEvolution {
  private readonly schemas: SchemaRepository;

  constructor(schemas: SchemaRepository) {
    this.schemas = schemas;
  }

  execute(id: string, input: ApplyEvolutionInput): Promise<Schema> {
    return this.schemas.applyEvolution(id, input);
  }
}

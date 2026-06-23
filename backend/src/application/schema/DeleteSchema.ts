import type { SchemaRepository } from '../../domain/schema/SchemaRepository';
import { SchemaNotFound } from '../../domain/schema/SchemaErrors';
import type { EventPublisher } from '../ports/EventPublisher';

export class DeleteSchema {
  constructor(
    private readonly schemas: SchemaRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.schemas.findById(id);
    if (!existing) throw new SchemaNotFound(id);
    await this.schemas.delete(id);
    this.publisher.publish({ type: 'schema.deleted', schemaId: id });
  }
}

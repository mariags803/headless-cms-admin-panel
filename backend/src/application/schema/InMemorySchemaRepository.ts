import type { Schema } from '../../domain/schema/Schema';
import type { SchemaRepository } from '../../domain/schema/SchemaRepository';

export class InMemorySchemaRepository implements SchemaRepository {
  private readonly store = new Map<string, Schema>();

  async findAll(): Promise<Schema[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Schema | null> {
    return this.store.get(id) ?? null;
  }

  async save(schema: Schema): Promise<void> {
    this.store.set(schema.id, schema);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

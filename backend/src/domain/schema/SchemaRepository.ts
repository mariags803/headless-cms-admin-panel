import type { Schema } from './Schema';

export interface SchemaRepository {
  findAll(): Promise<Schema[]>;
  findById(id: string): Promise<Schema | null>;
  save(schema: Schema): Promise<void>;
  delete(id: string): Promise<void>;
}

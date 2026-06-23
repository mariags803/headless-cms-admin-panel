import type { Schema } from '@cms/shared';

export interface NewSchemaInput {
  name: string;
  fields: Schema['fields'];
}

export interface SchemaUpdateInput {
  name: string;
  fields: Schema['fields'];
}

export interface SchemaRepository {
  findAll(): Promise<Schema[]>;
  findById(id: string): Promise<Schema | null>;
  create(input: NewSchemaInput): Promise<Schema>;
  update(id: string, input: SchemaUpdateInput): Promise<Schema>;
  delete(id: string): Promise<void>;
}

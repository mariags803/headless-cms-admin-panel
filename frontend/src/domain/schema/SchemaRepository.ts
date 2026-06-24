import type { Field, FieldValue, Schema } from '@cms/shared';

export type FieldInput = Omit<Field, 'id'> & { id?: string };

export interface NewSchemaInput {
  name: string;
  fields: FieldInput[];
}

export interface SchemaUpdateInput {
  name: string;
  fields: FieldInput[];
}

export interface EvolutionCorrection {
  entryId: string;
  fieldId: string;
  value: FieldValue;
}

export interface ApplyEvolutionInput {
  newSchema: SchemaUpdateInput;
  corrections: EvolutionCorrection[];
}

export interface SchemaRepository {
  findAll(): Promise<Schema[]>;
  findById(id: string): Promise<Schema | null>;
  create(input: NewSchemaInput): Promise<Schema>;
  update(id: string, input: SchemaUpdateInput): Promise<Schema>;
  applyEvolution(id: string, input: ApplyEvolutionInput): Promise<Schema>;
  delete(id: string): Promise<void>;
}

export type FieldValue = string | number | boolean | null;
// A reference value is the target Entry's id (string) or null.

export interface Entry {
  id: string;
  schemaId: string;
  data: Record<string, FieldValue>; // key = Field.id (NEVER Field.name)
  createdAt: string;
  updatedAt: string;
}

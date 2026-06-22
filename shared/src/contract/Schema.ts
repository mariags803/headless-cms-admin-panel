import type { Field } from './Field';

export interface Schema {
  id: string;
  name: string; // "Car", "Person", "Article"...
  fields: Field[];
  createdAt: string; // ISO 8601
  updatedAt: string;
}

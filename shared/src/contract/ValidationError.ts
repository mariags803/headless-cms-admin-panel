export interface ValidationError {
  fieldId?: string; // absent for schema-level errors (e.g. missing schemaId)
  message: string;
}

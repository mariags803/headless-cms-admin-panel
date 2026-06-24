import type { FieldValue } from '../contract/Entry';
import type { Schema } from '../contract/Schema';
import type { ValidationError } from '../contract/ValidationError';

function isEmpty(value: FieldValue | undefined): boolean {
  return value === undefined || value === null || value === '';
}

function matchesType(value: FieldValue | undefined, type: string): boolean {
  switch (type) {
    case 'text':
    case 'date':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'reference':
      return value === null || typeof value === 'string';
    default:
      return true;
  }
}

export interface ValidateEntryOptions {
  // Skip type checks for non-reference fields — used when applying schema-evolution
  // corrections, where the value is being migrated to a not-yet-persisted schema and
  // can't be checked against the (about to be replaced) current field types.
  skipTypeCheck?: boolean;
}

export function validateEntry(
  data: Record<string, FieldValue>,
  schema: Schema,
  options?: ValidateEntryOptions,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of schema.fields) {
    const value = data[field.id];

    if (field.required && isEmpty(value)) {
      errors.push({ fieldId: field.id, message: 'required' });
      continue;
    }

    if (isEmpty(value)) continue;
    if (field.type !== 'reference' && options?.skipTypeCheck) continue;

    if (!matchesType(value, field.type)) {
      errors.push({ fieldId: field.id, message: `expected ${field.type}` });
    }
  }

  return errors;
}

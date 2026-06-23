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

export function validateEntry(data: Record<string, FieldValue>, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of schema.fields) {
    const value = data[field.id];

    if (field.required && isEmpty(value)) {
      errors.push({ fieldId: field.id, message: 'required' });
      continue;
    }

    if (!isEmpty(value) && !matchesType(value, field.type)) {
      errors.push({ fieldId: field.id, message: `expected ${field.type}` });
    }
  }

  return errors;
}

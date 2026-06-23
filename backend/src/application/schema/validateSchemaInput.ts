import type { Field, FieldType } from '@cms/shared';

const FIELD_TYPES: FieldType[] = ['text', 'number', 'boolean', 'date', 'reference'];

export interface SchemaInputShape {
  name: string;
  fields: Field[];
}

export function validateSchemaInput(input: SchemaInputShape): string[] {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push('name is required');
  }

  const fields = input.fields ?? [];
  const seenIds = new Set<string>();
  for (const field of fields) {
    if (!field.id || !String(field.id).trim()) {
      errors.push('field.id is required');
    } else if (seenIds.has(field.id)) {
      errors.push(`duplicate field id: ${field.id}`);
    } else {
      seenIds.add(field.id);
    }

    if (!field.name || !String(field.name).trim()) {
      errors.push(`field ${field.id ?? '(unknown)'}: name is required`);
    }

    if (!FIELD_TYPES.includes(field.type)) {
      errors.push(`field ${field.id ?? '(unknown)'}: invalid type "${field.type}"`);
    }

    if (typeof field.required !== 'boolean') {
      errors.push(`field ${field.id ?? '(unknown)'}: required must be a boolean`);
    }

    if (field.type === 'reference' && !field.refSchemaId) {
      errors.push(`field ${field.id ?? '(unknown)'}: reference fields require refSchemaId`);
    }
  }

  return errors;
}

import type { Field } from '../contract/Field';
import type { Schema } from '../contract/Schema';
import type { SchemaChange } from '../contract/evolution';

export function diffSchemas(old: Schema, next: Schema): SchemaChange[] {
  const oldById = new Map<string, Field>(old.fields.map((f) => [f.id, f]));
  const nextById = new Map<string, Field>(next.fields.map((f) => [f.id, f]));

  const changes: SchemaChange[] = [];

  for (const oldField of old.fields) {
    const nextField = nextById.get(oldField.id);
    if (!nextField) {
      changes.push({ kind: 'field.removed', field: oldField });
      continue;
    }

    if (oldField.name !== nextField.name) {
      changes.push({ kind: 'field.renamed', fieldId: oldField.id, from: oldField.name, to: nextField.name });
    }
    if (oldField.type !== nextField.type) {
      changes.push({ kind: 'field.retyped', fieldId: oldField.id, from: oldField.type, to: nextField.type });
    }
    if (oldField.required !== nextField.required) {
      changes.push({ kind: 'field.requiredChanged', fieldId: oldField.id, required: nextField.required });
    }
    if (oldField.refSchemaId !== nextField.refSchemaId) {
      changes.push({
        kind: 'field.refRetargeted',
        fieldId: oldField.id,
        from: oldField.refSchemaId,
        to: nextField.refSchemaId,
      });
    }
  }

  for (const nextField of next.fields) {
    if (!oldById.has(nextField.id)) {
      changes.push({ kind: 'field.added', field: nextField });
    }
  }

  return changes;
}

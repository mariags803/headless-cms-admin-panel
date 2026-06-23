import type { Schema } from '../../domain/schema/Schema';
import type { Entry, FieldValue } from '../../domain/entry/Entry';

export function resolveEntryData(schema: Schema, entry: Entry): Record<string, FieldValue> {
  const resolved: Record<string, FieldValue> = {};
  for (const field of schema.fields) {
    resolved[field.name] = entry.data[field.id] ?? null;
  }
  return resolved;
}

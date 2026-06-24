import type { Entry } from '../contract/Entry';
import type { AffectedEntry, SchemaChange } from '../contract/evolution';
import { coerce } from './coerce';

export function scanAffected(changes: SchemaChange[], entries: Entry[]): AffectedEntry[] {
  const affected: AffectedEntry[] = [];

  for (const change of changes) {
    switch (change.kind) {
      case 'field.removed':
        for (const entry of entries) {
          if (change.field.id in entry.data) {
            affected.push({
              entryId: entry.id,
              fieldId: change.field.id,
              currentValue: entry.data[change.field.id] ?? null,
            });
          }
        }
        break;

      case 'field.retyped':
        for (const entry of entries) {
          if (change.fieldId in entry.data) {
            const currentValue = entry.data[change.fieldId] ?? null;
            affected.push({
              entryId: entry.id,
              fieldId: change.fieldId,
              currentValue,
              coerced: coerce(currentValue, change.to),
            });
          }
        }
        break;

      case 'field.requiredChanged':
        if (!change.required) break;
        for (const entry of entries) {
          if (entry.data[change.fieldId] == null) {
            affected.push({ entryId: entry.id, fieldId: change.fieldId, currentValue: null });
          }
        }
        break;

      case 'field.refRetargeted':
        if (!change.to) break;
        for (const entry of entries) {
          if (!(change.fieldId in entry.data)) continue;
          const currentValue = entry.data[change.fieldId] ?? null;
          if (currentValue === null) continue;
          const resolves = entries.some((candidate) => candidate.id === currentValue);
          if (!resolves) {
            affected.push({ entryId: entry.id, fieldId: change.fieldId, currentValue });
          }
        }
        break;

      // field.added, field.renamed: id-keyed data, never breaks existing entries.
    }
  }

  return affected;
}

import type { Field } from './Field';
import type { FieldType } from './FieldType';
import type { FieldValue } from './Entry';

export type SchemaChange =
  | { kind: 'field.added'; field: Field }
  | { kind: 'field.removed'; field: Field }
  | { kind: 'field.renamed'; fieldId: string; from: string; to: string }
  | { kind: 'field.retyped'; fieldId: string; from: FieldType; to: FieldType }
  | { kind: 'field.requiredChanged'; fieldId: string; required: boolean }
  | { kind: 'field.refRetargeted'; fieldId: string; from?: string; to?: string };

export type RiskLevel = 'safe' | 'warning' | 'destructive';

export interface AffectedEntry {
  entryId: string;
  fieldId: string;
  currentValue: FieldValue;
  coerced?: { ok: true; value: FieldValue } | { ok: false }; // for retypes
}

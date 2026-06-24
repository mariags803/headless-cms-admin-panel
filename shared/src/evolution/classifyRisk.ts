import type { SchemaChange, RiskLevel } from '../contract/evolution';

// Structural from/to coercibility, no Entry access — real per-value verdicts are
// 6.2's scanAffected/coerce. `reference` is always destructive both ways (an entry-id
// has no scalar reinterpretation). `text` is the universal "maybe" partner for
// number/boolean/date since their stored values round-trip through string form.
// number<->boolean is a judgment call (0/1) left as warning for coerce to settle.
const COERCIBLE_RETYPE_PAIRS = new Set<string>([
  'text->number', 'number->text',
  'text->boolean', 'boolean->text',
  'text->date', 'date->text',
  'number->boolean', 'boolean->number',
]);

export function classifyRisk(change: SchemaChange): RiskLevel {
  switch (change.kind) {
    case 'field.added':
    case 'field.renamed':
      return 'safe';
    case 'field.removed':
      return 'destructive';
    case 'field.requiredChanged':
      return change.required ? 'warning' : 'safe';
    case 'field.refRetargeted':
      return 'warning';
    case 'field.retyped':
      return COERCIBLE_RETYPE_PAIRS.has(`${change.from}->${change.to}`) ? 'warning' : 'destructive';
  }
}

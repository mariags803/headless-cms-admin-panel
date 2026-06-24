import type { SchemaChange } from '@cms/shared';

export function describeChange(change: SchemaChange, fieldNames: Record<string, string>): string {
  switch (change.kind) {
    case 'field.added':
      return `The field "${change.field.name} will be added".`;
    case 'field.removed':
      return `The field "${change.field.name} will be removed".`;
    case 'field.renamed':
      return `The "${change.from}" will be renamed to "${change.to}".`;
    case 'field.retyped':
      return `The field "${fieldNames[change.fieldId] ?? change.fieldId}" will be change the ${change.from} type to ${change.to}.`;
    case 'field.requiredChanged':
      return `The field "${fieldNames[change.fieldId] ?? change.fieldId}" will become ${
        change.required ? 'required' : 'optional'
      }.`;
    case 'field.refRetargeted':
      return `The reference of "${fieldNames[change.fieldId] ?? change.fieldId}" field will change to a different destination.`;
  }
}

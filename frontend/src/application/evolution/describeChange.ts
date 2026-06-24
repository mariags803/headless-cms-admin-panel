import type { SchemaChange } from '@cms/shared';

export function describeChange(change: SchemaChange, fieldNames: Record<string, string>): string {
  switch (change.kind) {
    case 'field.added':
      return `Se agregará el campo "${change.field.name}".`;
    case 'field.removed':
      return `Se eliminará el campo "${change.field.name}".`;
    case 'field.renamed':
      return `El campo "${change.from}" se renombrará a "${change.to}".`;
    case 'field.retyped':
      return `El campo "${fieldNames[change.fieldId] ?? change.fieldId}" cambiará de tipo ${change.from} a ${change.to}.`;
    case 'field.requiredChanged':
      return `El campo "${fieldNames[change.fieldId] ?? change.fieldId}" pasará a ser ${
        change.required ? 'obligatorio' : 'opcional'
      }.`;
    case 'field.refRetargeted':
      return `La referencia del campo "${fieldNames[change.fieldId] ?? change.fieldId}" cambiará de destino.`;
  }
}

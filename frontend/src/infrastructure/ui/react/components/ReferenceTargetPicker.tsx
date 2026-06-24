import type { Schema } from '@cms/shared';

export interface ReferenceTargetPickerProps {
  index: number;
  value: string | undefined;
  schemas: Schema[];
  onChange: (refSchemaId: string) => void;
}

export function ReferenceTargetPicker({ index, value, schemas, onChange }: ReferenceTargetPickerProps) {
  if (schemas.length === 0) {
    return <p className="inlineEmpty">No hay otros tipos de contenido disponibles.</p>;
  }

  return (
    <select
      aria-label={`Field ${index + 1} reference target`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        Select a content type…
      </option>
      {schemas.map((schema) => (
        <option key={schema.id} value={schema.id}>
          {schema.name}
        </option>
      ))}
    </select>
  );
}

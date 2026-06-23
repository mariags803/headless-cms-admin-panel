import type { Field, FieldType, Schema } from '@cms/shared';
import styles from './SchemaFieldRow.module.css';

export interface FieldDraft {
  key: string;
  id?: string;
  name: string;
  type: FieldType;
  required: boolean;
  refSchemaId?: string;
}

export interface SchemaFieldRowProps {
  field: FieldDraft;
  index: number;
  total: number;
  schemas: Schema[];
  nameError?: string;
  onChange: (patch: Partial<Omit<FieldDraft, 'key' | 'id'>>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const FIELD_TYPES: FieldType[] = ['text', 'number', 'boolean', 'date', 'reference'];

export function SchemaFieldRow({
  field,
  index,
  total,
  schemas,
  nameError,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SchemaFieldRowProps) {
  return (
    <li className={styles.row} data-invalid={nameError ? '' : undefined}>
      <input
        aria-label={`Field ${index + 1} name`}
        value={field.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <select
        aria-label={`Field ${index + 1} type`}
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value as FieldType, refSchemaId: undefined })}
      >
        {FIELD_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {field.type === 'reference' && (
        <select
          aria-label={`Field ${index + 1} reference target`}
          value={field.refSchemaId ?? ''}
          onChange={(e) => onChange({ refSchemaId: e.target.value })}
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
      )}

      <label>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        Required
      </label>

      <div className={styles.rowActions}>
        <button type="button" onClick={onMoveUp} disabled={index === 0} aria-label="Move field up">
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Move field down"
        >
          ↓
        </button>
        <button type="button" onClick={onRemove} aria-label="Remove field">
          Remove
        </button>
      </div>

      {nameError && <p role="alert">{nameError}</p>}
    </li>
  );
}

export function toFieldPayload(field: FieldDraft): Omit<Field, 'id'> & { id?: string } {
  return {
    ...(field.id ? { id: field.id } : {}),
    name: field.name.trim(),
    type: field.type,
    required: field.required,
    ...(field.type === 'reference' ? { refSchemaId: field.refSchemaId } : {}),
  };
}

import type { Entry, Schema } from '@cms/shared';
import type { FieldInputProps } from './FieldInputProps';
import { useSchema } from '../../hooks/useSchema';
import { useEntries } from '../../hooks/useEntries';
import styles from './FieldInput.module.css';

function entryLabel(schema: Schema | null | undefined, entry: Entry): string {
  const textField = schema?.fields.find((f) => f.type === 'text');
  const value = textField ? entry.data[textField.id] : undefined;
  return typeof value === 'string' && value !== '' ? value : entry.id;
}

export function ReferenceInput({ field, value, onChange, error }: FieldInputProps) {
  const { data: schema, isLoading: isSchemaLoading } = useSchema(field.refSchemaId);
  const { data: entries, isLoading: isEntriesLoading } = useEntries(field.refSchemaId);
  const isLoading = isSchemaLoading || isEntriesLoading;
  const currentValue = typeof value === 'string' ? value : '';

  if (!isLoading && (entries ?? []).length === 0) {
    return (
      <>
        <p className="inlineEmpty">No entries available for this reference yet.</p>
        {error && <p role="alert">{error}</p>}
      </>
    );
  }

  return (
    <>
      {isLoading && <p data-state="loading">Loading options…</p>}
      <div className={styles.row}>
        <select
          className={styles.input}
          data-invalid={error ? '' : undefined}
          aria-label={field.name}
          disabled={isLoading}
          value={currentValue}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">— none —</option>
          {(entries ?? []).map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entryLabel(schema, entry)}
            </option>
          ))}
        </select>
      </div>
      {error && <p role="alert">{error}</p>}
    </>
  );
}

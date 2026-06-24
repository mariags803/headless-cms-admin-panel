import type { FieldInputProps } from './FieldInputProps';
import styles from './FieldInput.module.css';

export function DateInput({ field, value, onChange, error }: FieldInputProps) {
  return (
    <>
      <input
        className={styles.input}
        data-invalid={error ? '' : undefined}
        type="date"
        aria-label={field.name}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
}

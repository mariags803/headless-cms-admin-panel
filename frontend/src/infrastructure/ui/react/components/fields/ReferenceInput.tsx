import type { FieldInputProps } from './FieldInputProps';
import styles from './FieldInput.module.css';

// Plain entry-id input for now; task 5.4 replaces the inside with a target-entry
// dropdown + jump-to-entry link without changing this component's props.
export function ReferenceInput({ field, value, onChange, error }: FieldInputProps) {
  return (
    <>
      <input
        className={styles.input}
        data-invalid={error ? '' : undefined}
        type="text"
        aria-label={field.name}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
}

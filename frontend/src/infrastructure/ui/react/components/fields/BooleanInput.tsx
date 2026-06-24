import type { FieldInputProps } from './FieldInputProps';
import styles from './FieldInput.module.css';

export function BooleanInput({ field, value, onChange, error }: FieldInputProps) {
  return (
    <>
      <input
        className={styles.input}
        data-invalid={error ? '' : undefined}
        type="checkbox"
        aria-label={field.name}
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
}

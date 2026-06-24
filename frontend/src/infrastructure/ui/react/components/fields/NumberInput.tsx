import type { FieldInputProps } from './FieldInputProps';
import styles from './FieldInput.module.css';

export function NumberInput({ field, value, onChange, error }: FieldInputProps) {
  return (
    <>
      <input
        className={styles.input}
        data-invalid={error ? '' : undefined}
        type="number"
        aria-label={field.name}
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
}

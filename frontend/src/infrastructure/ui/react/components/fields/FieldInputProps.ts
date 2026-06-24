import type { Field, FieldValue } from '@cms/shared';

export interface FieldInputProps {
  field: Field;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
}

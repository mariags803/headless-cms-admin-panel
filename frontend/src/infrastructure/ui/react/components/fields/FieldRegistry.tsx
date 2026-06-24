import type { FieldType } from '@cms/shared';
import type { FieldInputProps } from './FieldInputProps';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { BooleanInput } from './BooleanInput';
import { DateInput } from './DateInput';
import { ReferenceInput } from './ReferenceInput';

export const FIELD_INPUTS: Record<FieldType, React.ComponentType<FieldInputProps>> = {
  text: TextInput,
  number: NumberInput,
  boolean: BooleanInput,
  date: DateInput,
  reference: ReferenceInput,
};

export function FieldInput(props: FieldInputProps) {
  const Input = FIELD_INPUTS[props.field.type];
  return <Input {...props} />;
}

import type { FieldType } from './FieldType';

export interface Field {
  id: string; // stable uuid. DATA IS KEYED BY THIS, NOT BY name.
  name: string; // label shown to users. Renaming is non-destructive.
  type: FieldType;
  required: boolean;
  refSchemaId?: string; // only when type === 'reference'
}

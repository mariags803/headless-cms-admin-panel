import type { Schema } from './Schema';
import type { Entry } from './Entry';

export type DomainEvent =
  | { type: 'schema.created'; schema: Schema }
  | { type: 'schema.updated'; schema: Schema }
  | { type: 'schema.deleted'; schemaId: string }
  | { type: 'entry.created'; entry: Entry }
  | { type: 'entry.updated'; entry: Entry }
  | { type: 'entry.deleted'; entryId: string; schemaId: string };

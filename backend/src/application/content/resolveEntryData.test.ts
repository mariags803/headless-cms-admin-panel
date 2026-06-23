import { resolveEntryData } from './resolveEntryData';
import type { Schema } from '../../domain/schema/Schema';

describe('resolveEntryData', () => {
  const schema: Schema = {
    id: 's1',
    name: 'Car',
    fields: [
      { id: 'f-brand', name: 'brand', type: 'text', required: true },
      { id: 'f-year', name: 'year', type: 'number', required: false },
    ],
    createdAt: 't',
    updatedAt: 't',
  };

  it('maps field ids to field names', () => {
    const resolved = resolveEntryData(schema, {
      id: 'e1',
      schemaId: 's1',
      data: { 'f-brand': 'Toyota', 'f-year': 2020 },
      createdAt: 't',
      updatedAt: 't',
    });

    expect(resolved).toEqual({ brand: 'Toyota', year: 2020 });
  });

  it('defaults a missing field value to null', () => {
    const resolved = resolveEntryData(schema, {
      id: 'e1',
      schemaId: 's1',
      data: { 'f-brand': 'Toyota' },
      createdAt: 't',
      updatedAt: 't',
    });

    expect(resolved).toEqual({ brand: 'Toyota', year: null });
  });
});

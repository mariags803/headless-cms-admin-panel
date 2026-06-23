import type { Schema } from '../contract/Schema';
import { validateEntry } from './validateEntry';

const schema: Schema = {
  id: 's1',
  name: 'Car',
  fields: [
    { id: 'f-brand', name: 'brand', type: 'text', required: true },
    { id: 'f-year', name: 'year', type: 'number', required: false },
    { id: 'f-used', name: 'used', type: 'boolean', required: false },
    { id: 'f-bought', name: 'bought', type: 'date', required: false },
    { id: 'f-owner', name: 'owner', type: 'reference', required: false, refSchemaId: 's2' },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('validateEntry', () => {
  it('returns no errors for a valid entry', () => {
    const errors = validateEntry(
      { 'f-brand': 'Toyota', 'f-year': 2020, 'f-used': true, 'f-bought': '2024-01-01', 'f-owner': 'e1' },
      schema,
    );

    expect(errors).toEqual([]);
  });

  it('flags a missing required field', () => {
    const errors = validateEntry({}, schema);

    expect(errors).toEqual([{ fieldId: 'f-brand', message: 'required' }]);
  });

  it('flags an empty-string value for a required field', () => {
    const errors = validateEntry({ 'f-brand': '' }, schema);

    expect(errors).toEqual([{ fieldId: 'f-brand', message: 'required' }]);
  });

  it('flags a type mismatch for each FieldType', () => {
    const errors = validateEntry(
      { 'f-brand': 'Toyota', 'f-year': 'old', 'f-used': 'yes', 'f-bought': 123, 'f-owner': 42 },
      schema,
    );

    expect(errors).toEqual([
      { fieldId: 'f-year', message: 'expected number' },
      { fieldId: 'f-used', message: 'expected boolean' },
      { fieldId: 'f-bought', message: 'expected date' },
      { fieldId: 'f-owner', message: 'expected reference' },
    ]);
  });

  it('accepts a null reference value without checking existence', () => {
    const errors = validateEntry({ 'f-brand': 'Toyota', 'f-owner': null }, schema);

    expect(errors).toEqual([]);
  });

  it('accepts a reference value that points at a non-existent entry (no existence check)', () => {
    const errors = validateEntry({ 'f-brand': 'Toyota', 'f-owner': 'does-not-exist' }, schema);

    expect(errors).toEqual([]);
  });

  it('ignores unknown keys not matching any field.id', () => {
    const errors = validateEntry({ 'f-brand': 'Toyota', 'unknown-key': 'whatever' }, schema);

    expect(errors).toEqual([]);
  });
});

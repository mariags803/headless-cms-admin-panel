import type { Schema } from '../contract/Schema';
import { diffSchemas } from './diffSchemas';

function makeSchema(fields: Schema['fields']): Schema {
  return {
    id: 's1',
    name: 'Car',
    fields,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('diffSchemas', () => {
  it('returns [] for identical schemas', () => {
    const old = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const next = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);

    expect(diffSchemas(old, next)).toEqual([]);
  });

  it('returns [] for two empty schemas', () => {
    expect(diffSchemas(makeSchema([]), makeSchema([]))).toEqual([]);
  });

  it('detects a pure field add', () => {
    const old = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const added = { id: 'f2', name: 'year', type: 'number' as const, required: false };
    const next = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }, added]);

    expect(diffSchemas(old, next)).toEqual([{ kind: 'field.added', field: added }]);
  });

  it('detects a pure field remove', () => {
    const removed = { id: 'f1', name: 'brand', type: 'text' as const, required: true };
    const old = makeSchema([removed, { id: 'f2', name: 'year', type: 'number', required: false }]);
    const next = makeSchema([{ id: 'f2', name: 'year', type: 'number', required: false }]);

    expect(diffSchemas(old, next)).toEqual([{ kind: 'field.removed', field: removed }]);
  });

  it('detects a rename only', () => {
    const old = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const next = makeSchema([{ id: 'f1', name: 'make', type: 'text', required: true }]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.renamed', fieldId: 'f1', from: 'brand', to: 'make' },
    ]);
  });

  it('detects a retype only', () => {
    const old = makeSchema([{ id: 'f1', name: 'year', type: 'text', required: false }]);
    const next = makeSchema([{ id: 'f1', name: 'year', type: 'number', required: false }]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'number' },
    ]);
  });

  it('detects required false -> true', () => {
    const old = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: false }]);
    const next = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.requiredChanged', fieldId: 'f1', required: true },
    ]);
  });

  it('detects required true -> false', () => {
    const old = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const next = makeSchema([{ id: 'f1', name: 'brand', type: 'text', required: false }]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.requiredChanged', fieldId: 'f1', required: false },
    ]);
  });

  it('detects a reference retarget', () => {
    const old = makeSchema([
      { id: 'f1', name: 'owner', type: 'reference', required: false, refSchemaId: 's-person' },
    ]);
    const next = makeSchema([
      { id: 'f1', name: 'owner', type: 'reference', required: false, refSchemaId: 's-company' },
    ]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.refRetargeted', fieldId: 'f1', from: 's-person', to: 's-company' },
    ]);
  });

  it('detects a reference retarget from undefined to a schema id', () => {
    const old = makeSchema([
      { id: 'f1', name: 'owner', type: 'reference', required: false, refSchemaId: undefined },
    ]);
    const next = makeSchema([
      { id: 'f1', name: 'owner', type: 'reference', required: false, refSchemaId: 's-company' },
    ]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.refRetargeted', fieldId: 'f1', from: undefined, to: 's-company' },
    ]);
  });

  it('detects a combined rename + retype on the same field, in name-then-type order', () => {
    const old = makeSchema([{ id: 'f1', name: 'year', type: 'text', required: false }]);
    const next = makeSchema([{ id: 'f1', name: 'modelYear', type: 'number', required: false }]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.renamed', fieldId: 'f1', from: 'year', to: 'modelYear' },
      { kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'number' },
    ]);
  });

  it('detects retype + requiredChanged + refRetarget on one field, in fixed sub-order', () => {
    const old = makeSchema([
      { id: 'f1', name: 'owner', type: 'text', required: false, refSchemaId: undefined },
    ]);
    const next = makeSchema([
      { id: 'f1', name: 'owner', type: 'reference', required: true, refSchemaId: 's-person' },
    ]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'reference' },
      { kind: 'field.requiredChanged', fieldId: 'f1', required: true },
      { kind: 'field.refRetargeted', fieldId: 'f1', from: undefined, to: 's-person' },
    ]);
  });

  it('detects multiple independent changes across different fields in old-then-new order', () => {
    const removed = { id: 'f-removed', name: 'old', type: 'text' as const, required: false };
    const old = makeSchema([
      removed,
      { id: 'f-renamed', name: 'brand', type: 'text', required: true },
    ]);
    const added = { id: 'f-added', name: 'year', type: 'number' as const, required: false };
    const next = makeSchema([
      { id: 'f-renamed', name: 'make', type: 'text', required: true },
      added,
    ]);

    expect(diffSchemas(old, next)).toEqual([
      { kind: 'field.removed', field: removed },
      { kind: 'field.renamed', fieldId: 'f-renamed', from: 'brand', to: 'make' },
      { kind: 'field.added', field: added },
    ]);
  });

  it('matches fields by id regardless of array position, ignoring pure reordering', () => {
    const old = makeSchema([
      { id: 'f1', name: 'brand', type: 'text', required: true },
      { id: 'f2', name: 'year', type: 'number', required: false },
    ]);
    const next = makeSchema([
      { id: 'f2', name: 'year', type: 'number', required: false },
      { id: 'f1', name: 'brand', type: 'text', required: true },
    ]);

    expect(diffSchemas(old, next)).toEqual([]);
  });
});

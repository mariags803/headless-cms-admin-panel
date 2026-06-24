import type { Entry } from '../contract/Entry';
import type { SchemaChange } from '../contract/evolution';
import { scanAffected } from './scanAffected';

function makeEntry(id: string, data: Entry['data'], schemaId = 's1'): Entry {
  return { id, schemaId, data, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
}

describe('scanAffected', () => {
  it('ignores field.added — never affects existing entries', () => {
    const entries = [makeEntry('e1', { f1: 'x' })];
    const changes: SchemaChange[] = [
      { kind: 'field.added', field: { id: 'f2', name: 'new', type: 'text', required: false } },
    ];
    expect(scanAffected(changes, entries)).toEqual([]);
  });

  it('ignores field.renamed — data survives by id', () => {
    const entries = [makeEntry('e1', { f1: 'x' })];
    const changes: SchemaChange[] = [{ kind: 'field.renamed', fieldId: 'f1', from: 'brand', to: 'make' }];
    expect(scanAffected(changes, entries)).toEqual([]);
  });

  describe('field.removed', () => {
    it('flags every entry holding the removed field, no coerced result', () => {
      const entries = [makeEntry('e1', { f1: 'x' }), makeEntry('e2', { other: 'y' })];
      const changes: SchemaChange[] = [
        { kind: 'field.removed', field: { id: 'f1', name: 'brand', type: 'text', required: false } },
      ];
      expect(scanAffected(changes, entries)).toEqual([
        { entryId: 'e1', fieldId: 'f1', currentValue: 'x' },
      ]);
    });
  });

  describe('field.retyped', () => {
    it('splits coercible and non-coercible values — the year text->number case', () => {
      const entries = [
        makeEntry('e1', { f1: '2024' }),
        makeEntry('e2', { f1: 'vintage' }),
        makeEntry('e3', { other: 'irrelevant' }),
      ];
      const changes: SchemaChange[] = [{ kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'number' }];
      expect(scanAffected(changes, entries)).toEqual([
        { entryId: 'e1', fieldId: 'f1', currentValue: '2024', coerced: { ok: true, value: 2024 } },
        { entryId: 'e2', fieldId: 'f1', currentValue: 'vintage', coerced: { ok: false } },
      ]);
    });
  });

  describe('field.requiredChanged', () => {
    it('flags only entries with a null value, only when becoming required', () => {
      const entries = [makeEntry('e1', { f1: null }), makeEntry('e2', { f1: 'set' })];
      const changes: SchemaChange[] = [{ kind: 'field.requiredChanged', fieldId: 'f1', required: true }];
      expect(scanAffected(changes, entries)).toEqual([{ entryId: 'e1', fieldId: 'f1', currentValue: null }]);
    });

    it('never flags anything when becoming optional', () => {
      const entries = [makeEntry('e1', { f1: null })];
      const changes: SchemaChange[] = [{ kind: 'field.requiredChanged', fieldId: 'f1', required: false }];
      expect(scanAffected(changes, entries)).toEqual([]);
    });
  });

  describe('field.refRetargeted', () => {
    it('flags only references that no longer resolve to any entry', () => {
      const entries = [
        makeEntry('e1', { f1: 'target-1' }, 's1'),
        makeEntry('target-1', {}, 's2'),
        makeEntry('e2', { f1: 'missing-id' }, 's1'),
        makeEntry('e3', { f1: null }, 's1'),
      ];
      const changes: SchemaChange[] = [
        { kind: 'field.refRetargeted', fieldId: 'f1', from: 's-old', to: 's2' },
      ];
      expect(scanAffected(changes, entries)).toEqual([
        { entryId: 'e2', fieldId: 'f1', currentValue: 'missing-id' },
      ]);
    });

    it('skips when retargeted to undefined (no target schema)', () => {
      const entries = [makeEntry('e1', { f1: 'missing-id' })];
      const changes: SchemaChange[] = [
        { kind: 'field.refRetargeted', fieldId: 'f1', from: 's-old', to: undefined },
      ];
      expect(scanAffected(changes, entries)).toEqual([]);
    });
  });

  it('returns exactly the entries that break across multiple changes, no more no fewer', () => {
    const entries = [
      makeEntry('e1', { f1: '2024', f2: null }),
      makeEntry('e2', { f1: 'vintage', f2: 'set' }),
    ];
    const changes: SchemaChange[] = [
      { kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'number' },
      { kind: 'field.requiredChanged', fieldId: 'f2', required: true },
    ];
    expect(scanAffected(changes, entries)).toEqual([
      { entryId: 'e1', fieldId: 'f1', currentValue: '2024', coerced: { ok: true, value: 2024 } },
      { entryId: 'e2', fieldId: 'f1', currentValue: 'vintage', coerced: { ok: false } },
      { entryId: 'e1', fieldId: 'f2', currentValue: null },
    ]);
  });
});

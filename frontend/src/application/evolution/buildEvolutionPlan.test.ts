import type { Entry, Schema } from '@cms/shared';
import { buildEvolutionPlan } from './buildEvolutionPlan';

function schema(fields: Schema['fields']): Schema {
  return { id: 's1', name: 'Car', fields, createdAt: '', updatedAt: '' };
}

function entry(id: string, data: Entry['data']): Entry {
  return { id, schemaId: 's1', data, createdAt: '', updatedAt: '' };
}

describe('buildEvolutionPlan', () => {
  it('returns an empty, safe plan when nothing changed', () => {
    const old = schema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const plan = buildEvolutionPlan(old, old, []);

    expect(plan.changes).toEqual([]);
    expect(plan.affected).toEqual([]);
    expect(plan.highestRisk).toBe('safe');
    expect(plan.hasBlockingChanges).toBe(false);
  });

  it('classifies a rename as safe with no affected entries', () => {
    const old = schema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const next = schema([{ id: 'f1', name: 'make', type: 'text', required: true }]);
    const plan = buildEvolutionPlan(old, next, [entry('e1', { f1: 'Toyota' })]);

    expect(plan.changes).toEqual([
      { change: { kind: 'field.renamed', fieldId: 'f1', from: 'brand', to: 'make' }, risk: 'safe' },
    ]);
    expect(plan.affected).toEqual([]);
    expect(plan.highestRisk).toBe('safe');
    expect(plan.hasBlockingChanges).toBe(false);
  });

  it('classifies a coercible retype as warning and reports successful coercion', () => {
    const old = schema([{ id: 'f1', name: 'year', type: 'text', required: false }]);
    const next = schema([{ id: 'f1', name: 'year', type: 'number', required: false }]);
    const plan = buildEvolutionPlan(old, next, [entry('e1', { f1: '2024' })]);

    expect(plan.highestRisk).toBe('warning');
    expect(plan.hasBlockingChanges).toBe(false);
    expect(plan.affected).toEqual([
      { entryId: 'e1', fieldId: 'f1', currentValue: '2024', coerced: { ok: true, value: 2024 } },
    ]);
  });

  it('flags the hard text->number case as destructive when a value cannot coerce', () => {
    const old = schema([{ id: 'f1', name: 'year', type: 'text', required: false }]);
    const next = schema([{ id: 'f1', name: 'year', type: 'number', required: false }]);
    const plan = buildEvolutionPlan(old, next, [entry('e1', { f1: 'vintage' })]);

    expect(plan.highestRisk).toBe('destructive');
    expect(plan.hasBlockingChanges).toBe(true);
    expect(plan.affected).toEqual([
      { entryId: 'e1', fieldId: 'f1', currentValue: 'vintage', coerced: { ok: false } },
    ]);
  });

  it('classifies a field removal as destructive and reports affected entries', () => {
    const old = schema([{ id: 'f1', name: 'brand', type: 'text', required: true }]);
    const next = schema([]);
    const plan = buildEvolutionPlan(old, next, [entry('e1', { f1: 'Toyota' })]);

    expect(plan.highestRisk).toBe('destructive');
    expect(plan.hasBlockingChanges).toBe(true);
    expect(plan.affected).toEqual([{ entryId: 'e1', fieldId: 'f1', currentValue: 'Toyota' }]);
  });

  it('reduces highestRisk to the worst risk across a mixed set of changes', () => {
    const old = schema([
      { id: 'f1', name: 'brand', type: 'text', required: true },
      { id: 'f2', name: 'color', type: 'text', required: false },
    ]);
    const next = schema([
      { id: 'f1', name: 'make', type: 'text', required: true },
      { id: 'f2', name: 'color', type: 'text', required: false },
      { id: 'f3', name: 'notes', type: 'text', required: false },
    ]);
    const plan = buildEvolutionPlan(old, next, []);

    expect(plan.changes.map((c) => c.risk).sort()).toEqual(['safe', 'safe']);
    expect(plan.highestRisk).toBe('safe');
    expect(plan.hasBlockingChanges).toBe(false);
  });
});

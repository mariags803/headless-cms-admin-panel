import type { SchemaChange } from '../contract/evolution';
import type { FieldType } from '../contract/FieldType';
import { classifyRisk } from './classifyRisk';

describe('classifyRisk', () => {
  it('classifies field.added as safe', () => {
    const change: SchemaChange = {
      kind: 'field.added',
      field: { id: 'f1', name: 'year', type: 'number', required: false },
    };
    expect(classifyRisk(change)).toBe('safe');
  });

  it('classifies field.removed as destructive', () => {
    const change: SchemaChange = {
      kind: 'field.removed',
      field: { id: 'f1', name: 'year', type: 'number', required: false },
    };
    expect(classifyRisk(change)).toBe('destructive');
  });

  it('classifies field.renamed as safe', () => {
    const change: SchemaChange = { kind: 'field.renamed', fieldId: 'f1', from: 'brand', to: 'make' };
    expect(classifyRisk(change)).toBe('safe');
  });

  it('classifies field.requiredChanged to true as warning', () => {
    const change: SchemaChange = { kind: 'field.requiredChanged', fieldId: 'f1', required: true };
    expect(classifyRisk(change)).toBe('warning');
  });

  it('classifies field.requiredChanged to false as safe', () => {
    const change: SchemaChange = { kind: 'field.requiredChanged', fieldId: 'f1', required: false };
    expect(classifyRisk(change)).toBe('safe');
  });

  it('classifies field.refRetargeted as warning', () => {
    const change: SchemaChange = {
      kind: 'field.refRetargeted',
      fieldId: 'f1',
      from: undefined,
      to: 's-person',
    };
    expect(classifyRisk(change)).toBe('warning');
  });

  const coercible: Array<[FieldType, FieldType]> = [
    ['text', 'number'],
    ['number', 'text'],
    ['text', 'boolean'],
    ['boolean', 'text'],
    ['text', 'date'],
    ['date', 'text'],
    ['number', 'boolean'],
    ['boolean', 'number'],
  ];

  it.each(coercible)('classifies retype %s -> %s as warning', (from, to) => {
    const change: SchemaChange = { kind: 'field.retyped', fieldId: 'f1', from, to };
    expect(classifyRisk(change)).toBe('warning');
  });

  const nonCoercible: Array<[FieldType, FieldType]> = [
    ['text', 'reference'],
    ['reference', 'text'],
    ['number', 'date'],
    ['date', 'number'],
    ['number', 'reference'],
    ['reference', 'number'],
    ['boolean', 'date'],
    ['date', 'boolean'],
    ['boolean', 'reference'],
    ['reference', 'boolean'],
    ['date', 'reference'],
    ['reference', 'date'],
  ];

  it.each(nonCoercible)('classifies retype %s -> %s as destructive', (from, to) => {
    const change: SchemaChange = { kind: 'field.retyped', fieldId: 'f1', from, to };
    expect(classifyRisk(change)).toBe('destructive');
  });

  it('classifies a defensive same-type retype as destructive', () => {
    const change: SchemaChange = { kind: 'field.retyped', fieldId: 'f1', from: 'text', to: 'text' };
    expect(classifyRisk(change)).toBe('destructive');
  });
});

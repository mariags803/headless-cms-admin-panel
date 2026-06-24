import { coerce } from './coerce';

describe('coerce', () => {
  it('passes null through unchanged regardless of target type', () => {
    expect(coerce(null, 'number')).toEqual({ ok: true, value: null });
    expect(coerce(null, 'reference')).toEqual({ ok: true, value: null });
  });

  describe('-> text', () => {
    it('stringifies a number', () => {
      expect(coerce(2024, 'text')).toEqual({ ok: true, value: '2024' });
    });

    it('stringifies a boolean', () => {
      expect(coerce(true, 'text')).toEqual({ ok: true, value: 'true' });
    });
  });

  describe('-> number', () => {
    it('parses a numeric string', () => {
      expect(coerce('2024', 'number')).toEqual({ ok: true, value: 2024 });
    });

    it('fails on a non-numeric string', () => {
      expect(coerce('vintage', 'number')).toEqual({ ok: false });
    });

    it('fails on "n/a"', () => {
      expect(coerce('n/a', 'number')).toEqual({ ok: false });
    });

    it('fails on an empty string', () => {
      expect(coerce('', 'number')).toEqual({ ok: false });
    });

    it('coerces a boolean to 0/1', () => {
      expect(coerce(true, 'number')).toEqual({ ok: true, value: 1 });
      expect(coerce(false, 'number')).toEqual({ ok: true, value: 0 });
    });
  });

  describe('-> boolean', () => {
    it.each([
      ['true', true],
      ['True', true],
      ['1', true],
      ['yes', true],
      ['false', false],
      ['0', false],
      ['no', false],
    ])('parses %s as %s', (input, expected) => {
      expect(coerce(input, 'boolean')).toEqual({ ok: true, value: expected });
    });

    it('fails on an unrecognized string', () => {
      expect(coerce('maybe', 'boolean')).toEqual({ ok: false });
    });

    it('coerces a number via zero check', () => {
      expect(coerce(1, 'boolean')).toEqual({ ok: true, value: true });
      expect(coerce(0, 'boolean')).toEqual({ ok: true, value: false });
    });
  });

  describe('-> date', () => {
    it('passes through a valid ISO date string', () => {
      expect(coerce('2024-01-01', 'date')).toEqual({ ok: true, value: '2024-01-01' });
    });

    it('fails on an unparseable string', () => {
      expect(coerce('not-a-date', 'date')).toEqual({ ok: false });
    });

    it('fails on a non-string value', () => {
      expect(coerce(2024, 'date')).toEqual({ ok: false });
    });
  });

  describe('-> reference', () => {
    it('always fails: no scalar has a meaningful entry-id form', () => {
      expect(coerce('2024', 'reference')).toEqual({ ok: false });
      expect(coerce(2024, 'reference')).toEqual({ ok: false });
      expect(coerce(true, 'reference')).toEqual({ ok: false });
    });
  });
});

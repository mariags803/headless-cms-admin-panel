import type { FieldType } from '../contract/FieldType';
import type { FieldValue } from '../contract/Entry';

export type CoerceResult = { ok: true; value: FieldValue } | { ok: false };

const TRUTHY = new Set(['true', '1', 'yes']);
const FALSY = new Set(['false', '0', 'no']);

export function coerce(value: FieldValue, targetType: FieldType): CoerceResult {
  if (value === null) return { ok: true, value: null };

  switch (targetType) {
    case 'text':
      return { ok: true, value: String(value) };

    case 'number': {
      if (typeof value === 'string' && value.trim() === '') return { ok: false };
      const n = typeof value === 'boolean' ? Number(value) : Number(value);
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false };
    }

    case 'boolean': {
      if (typeof value === 'boolean') return { ok: true, value };
      if (typeof value === 'number') return { ok: true, value: value !== 0 };
      const lower = value.trim().toLowerCase();
      if (TRUTHY.has(lower)) return { ok: true, value: true };
      if (FALSY.has(lower)) return { ok: true, value: false };
      return { ok: false };
    }

    case 'date': {
      if (typeof value !== 'string') return { ok: false };
      return Number.isNaN(new Date(value).getTime()) ? { ok: false } : { ok: true, value };
    }

    case 'reference':
      return { ok: false };
  }
}

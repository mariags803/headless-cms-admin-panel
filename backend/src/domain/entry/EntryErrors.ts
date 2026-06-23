import type { ValidationError } from '@cms/shared';

export class EntryNotFound extends Error {
  constructor(public readonly id: string) {
    super(`Entry not found: ${id}`);
  }
}

export class InvalidEntry extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super(errors.map((e) => e.message).join('; '));
  }
}

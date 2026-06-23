export class SchemaNotFound extends Error {
  constructor(public readonly id: string) {
    super(`Schema not found: ${id}`);
  }
}

export class InvalidSchema extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join('; '));
  }
}

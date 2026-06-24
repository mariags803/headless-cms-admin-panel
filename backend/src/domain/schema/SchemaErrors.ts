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

export class EvolutionBlocked extends Error {
  constructor(public readonly affected: { entryId: string; fieldId: string }[]) {
    super('Schema update rejected: some affected entries have values that cannot be converted.');
  }
}

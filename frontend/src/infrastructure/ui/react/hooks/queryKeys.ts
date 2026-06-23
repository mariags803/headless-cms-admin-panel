export const schemaKeys = {
  list: () => ['schemas'] as const,
  detail: (id: string) => ['schemas', id] as const,
};

export const entryKeys = {
  list: (schemaId: string) => ['entries', schemaId] as const,
  detail: (schemaId: string, id: string) => ['entries', schemaId, id] as const,
};

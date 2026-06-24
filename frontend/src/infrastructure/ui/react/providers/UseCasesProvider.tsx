import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SchemaRepository } from '../../../../domain/schema/SchemaRepository';
import type { EntryRepository } from '../../../../domain/entry/EntryRepository';
import { HttpSchemaRepository } from '../../../http/HttpSchemaRepository';
import { HttpEntryRepository } from '../../../http/HttpEntryRepository';
import { ListSchemas } from '../../../../application/schema/ListSchemas';
import { GetSchema } from '../../../../application/schema/GetSchema';
import { CreateSchema } from '../../../../application/schema/CreateSchema';
import { UpdateSchema } from '../../../../application/schema/UpdateSchema';
import { ApplyEvolution } from '../../../../application/schema/ApplyEvolution';
import { DeleteSchema } from '../../../../application/schema/DeleteSchema';
import { ListEntries } from '../../../../application/entry/ListEntries';
import { GetEntry } from '../../../../application/entry/GetEntry';
import { CreateEntry } from '../../../../application/entry/CreateEntry';
import { UpdateEntry } from '../../../../application/entry/UpdateEntry';
import { DeleteEntry } from '../../../../application/entry/DeleteEntry';

export interface UseCases {
  listSchemas: ListSchemas;
  getSchema: GetSchema;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  applyEvolution: ApplyEvolution;
  deleteSchema: DeleteSchema;
  listEntries: ListEntries;
  getEntry: GetEntry;
  createEntry: CreateEntry;
  updateEntry: UpdateEntry;
  deleteEntry: DeleteEntry;
}

const UseCasesContext = createContext<UseCases | null>(null);

export function buildUseCases(
  schemas: SchemaRepository = new HttpSchemaRepository(),
  entries: EntryRepository = new HttpEntryRepository(),
): UseCases {
  return {
    listSchemas: new ListSchemas(schemas),
    getSchema: new GetSchema(schemas),
    createSchema: new CreateSchema(schemas),
    updateSchema: new UpdateSchema(schemas),
    applyEvolution: new ApplyEvolution(schemas),
    deleteSchema: new DeleteSchema(schemas),
    listEntries: new ListEntries(entries),
    getEntry: new GetEntry(entries),
    createEntry: new CreateEntry(entries),
    updateEntry: new UpdateEntry(entries),
    deleteEntry: new DeleteEntry(entries),
  };
}

export function UseCasesProvider({
  useCases,
  children,
}: {
  useCases?: UseCases;
  children: ReactNode;
}) {
  const value = useMemo(() => useCases ?? buildUseCases(), [useCases]);
  return <UseCasesContext.Provider value={value}>{children}</UseCasesContext.Provider>;
}

export function useUseCases(): UseCases {
  const useCases = useContext(UseCasesContext);
  if (!useCases) {
    throw new Error('useUseCases must be used within a UseCasesProvider');
  }
  return useCases;
}

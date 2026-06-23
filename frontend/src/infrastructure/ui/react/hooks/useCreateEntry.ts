import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewEntryInput } from '../../../../domain/entry/EntryRepository';
import { useUseCases } from '../providers/UseCasesProvider';
import { entryKeys } from './queryKeys';

export function useCreateEntry() {
  const { createEntry } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewEntryInput) => createEntry.execute(input),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.list(entry.schemaId) });
    },
  });
}

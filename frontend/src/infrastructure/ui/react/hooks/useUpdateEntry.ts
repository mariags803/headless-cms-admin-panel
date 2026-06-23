import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EntryUpdateInput } from '../../../../domain/entry/EntryRepository';
import { useUseCases } from '../providers/UseCasesProvider';
import { entryKeys } from './queryKeys';

export function useUpdateEntry() {
  const { updateEntry } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EntryUpdateInput }) => updateEntry.execute(id, input),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.list(entry.schemaId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(entry.schemaId, entry.id) });
    },
  });
}

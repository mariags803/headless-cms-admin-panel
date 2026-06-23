import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUseCases } from '../providers/UseCasesProvider';
import { entryKeys } from './queryKeys';

export function useDeleteEntry() {
  const { deleteEntry } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; schemaId: string }) => deleteEntry.execute(id),
    onSuccess: (_void, { id, schemaId }) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.list(schemaId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(schemaId, id) });
    },
  });
}

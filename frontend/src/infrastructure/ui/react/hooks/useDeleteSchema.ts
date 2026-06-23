import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUseCases } from '../providers/UseCasesProvider';
import { schemaKeys } from './queryKeys';

export function useDeleteSchema() {
  const { deleteSchema } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSchema.execute(id),
    onSuccess: (_void, id) => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.list() });
      queryClient.invalidateQueries({ queryKey: schemaKeys.detail(id) });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApplyEvolutionInput } from '../../../../domain/schema/SchemaRepository';
import { useUseCases } from '../providers/UseCasesProvider';
import { entryKeys, schemaKeys } from './queryKeys';

export function useApplyEvolution() {
  const { applyEvolution } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApplyEvolutionInput }) => applyEvolution.execute(id, input),
    onSuccess: (schema, { input }) => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.list() });
      queryClient.invalidateQueries({ queryKey: schemaKeys.detail(schema.id) });
      queryClient.invalidateQueries({ queryKey: entryKeys.list(schema.id) });
      for (const { entryId } of input.corrections) {
        queryClient.invalidateQueries({ queryKey: entryKeys.detail(schema.id, entryId) });
      }
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SchemaUpdateInput } from '../../../../domain/schema/SchemaRepository';
import { useUseCases } from '../providers/UseCasesProvider';
import { schemaKeys } from './queryKeys';

export function useUpdateSchema() {
  const { updateSchema } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SchemaUpdateInput }) => updateSchema.execute(id, input),
    onSuccess: (_schema, { id }) => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.list() });
      queryClient.invalidateQueries({ queryKey: schemaKeys.detail(id) });
    },
  });
}

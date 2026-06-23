import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewSchemaInput } from '../../../../domain/schema/SchemaRepository';
import { useUseCases } from '../providers/UseCasesProvider';
import { schemaKeys } from './queryKeys';

export function useCreateSchema() {
  const { createSchema } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewSchemaInput) => createSchema.execute(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.list() });
    },
  });
}

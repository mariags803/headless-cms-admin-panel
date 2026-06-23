import { useQuery } from '@tanstack/react-query';
import { useUseCases } from '../providers/UseCasesProvider';
import { schemaKeys } from './queryKeys';

export function useSchema(id: string | undefined) {
  const { getSchema } = useUseCases();
  return useQuery({
    queryKey: schemaKeys.detail(id ?? ''),
    queryFn: () => getSchema.execute(id as string),
    enabled: Boolean(id),
  });
}

import { useQuery } from '@tanstack/react-query';
import { useUseCases } from '../providers/UseCasesProvider';
import { schemaKeys } from './queryKeys';

export function useSchemas() {
  const { listSchemas } = useUseCases();
  return useQuery({
    queryKey: schemaKeys.list(),
    queryFn: () => listSchemas.execute(),
  });
}

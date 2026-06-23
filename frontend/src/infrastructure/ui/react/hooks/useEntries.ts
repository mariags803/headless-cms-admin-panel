import { useQuery } from '@tanstack/react-query';
import { useUseCases } from '../providers/UseCasesProvider';
import { entryKeys } from './queryKeys';

export function useEntries(schemaId: string | undefined) {
  const { listEntries } = useUseCases();
  return useQuery({
    queryKey: entryKeys.list(schemaId ?? ''),
    queryFn: () => listEntries.execute(schemaId as string),
    enabled: Boolean(schemaId),
  });
}

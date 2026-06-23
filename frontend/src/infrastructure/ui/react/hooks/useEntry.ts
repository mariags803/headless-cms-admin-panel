import { useQuery } from '@tanstack/react-query';
import { useUseCases } from '../providers/UseCasesProvider';
import { entryKeys } from './queryKeys';

export function useEntry(schemaId: string | undefined, id: string | undefined) {
  const { getEntry } = useUseCases();
  return useQuery({
    queryKey: entryKeys.detail(schemaId ?? '', id ?? ''),
    queryFn: () => getEntry.execute(id as string),
    enabled: Boolean(schemaId) && Boolean(id),
  });
}

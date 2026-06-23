import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { DomainEvent } from '../../../../domain/events/DomainEvent';
import { useRealtime } from './useRealtime';
import { entryKeys, schemaKeys } from './queryKeys';

export function useRealtimeInvalidation(): void {
  const queryClient = useQueryClient();

  const onEvent = useCallback(
    (event: DomainEvent) => {
      switch (event.type) {
        case 'schema.created':
        case 'schema.updated':
          queryClient.invalidateQueries({ queryKey: schemaKeys.list() });
          queryClient.invalidateQueries({ queryKey: schemaKeys.detail(event.schema.id) });
          break;
        case 'schema.deleted':
          queryClient.invalidateQueries({ queryKey: schemaKeys.list() });
          queryClient.invalidateQueries({ queryKey: schemaKeys.detail(event.schemaId) });
          break;
        case 'entry.created':
        case 'entry.updated':
          queryClient.invalidateQueries({ queryKey: entryKeys.list(event.entry.schemaId) });
          queryClient.invalidateQueries({ queryKey: entryKeys.detail(event.entry.schemaId, event.entry.id) });
          break;
        case 'entry.deleted':
          queryClient.invalidateQueries({ queryKey: entryKeys.list(event.schemaId) });
          queryClient.invalidateQueries({ queryKey: entryKeys.detail(event.schemaId, event.entryId) });
          break;
      }
    },
    [queryClient],
  );

  useRealtime(onEvent);
}

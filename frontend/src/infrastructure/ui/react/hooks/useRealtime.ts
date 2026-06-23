import { useEffect } from 'react';
import type { DomainEvent } from '../../../../domain/events/DomainEvent';
import { useRealtimeClient } from '../providers/RealtimeProvider';

export function useRealtime(onEvent: (event: DomainEvent) => void): void {
  const client = useRealtimeClient();

  useEffect(() => {
    return client.subscribe(onEvent);
  }, [client, onEvent]);
}

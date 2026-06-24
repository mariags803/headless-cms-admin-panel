import { useEffect, useState } from 'react';
import type { ConnectionStatus } from '../../../realtime/SseClient';
import { useRealtimeClient } from '../providers/RealtimeProvider';

export function useRealtimeStatus(): ConnectionStatus {
  const client = useRealtimeClient();
  const [status, setStatus] = useState<ConnectionStatus>(client.getStatus());

  useEffect(() => {
    setStatus(client.getStatus());
    return client.subscribeStatus(setStatus);
  }, [client]);

  return status;
}

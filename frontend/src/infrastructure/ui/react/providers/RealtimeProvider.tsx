import { createContext, useContext, type ReactNode } from 'react';
import { SseClient } from '../../../realtime/SseClient';

const RealtimeContext = createContext<SseClient | null>(null);

export function RealtimeProvider({
  client,
  children,
}: {
  client: SseClient;
  children: ReactNode;
}) {
  return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeClient(): SseClient {
  const client = useContext(RealtimeContext);
  if (!client) {
    throw new Error('useRealtimeClient must be used within a RealtimeProvider');
  }
  return client;
}

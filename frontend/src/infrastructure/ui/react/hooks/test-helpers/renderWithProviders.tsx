import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { DomainEvent } from '@cms/shared';
import { UseCasesProvider, type UseCases } from '../../providers/UseCasesProvider';
import { RealtimeProvider } from '../../providers/RealtimeProvider';
import type { ConnectionStatus, SseClient } from '../../../../realtime/SseClient';

export function fakeRealtimeClient() {
  const listeners = new Set<(event: DomainEvent) => void>();
  const statusListeners = new Set<(status: ConnectionStatus) => void>();
  let status: ConnectionStatus = 'open';
  return {
    client: {
      subscribe: (listener: (event: DomainEvent) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getStatus: () => status,
      subscribeStatus: (listener: (status: ConnectionStatus) => void) => {
        statusListeners.add(listener);
        return () => statusListeners.delete(listener);
      },
    } as unknown as SseClient,
    emit: (event: DomainEvent) => {
      for (const listener of listeners) listener(event);
    },
    setStatus: (next: ConnectionStatus) => {
      status = next;
      for (const listener of statusListeners) listener(next);
    },
  };
}

export function makeWrapper(useCases: UseCases, realtimeClient: SseClient = fakeRealtimeClient().client) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <UseCasesProvider useCases={useCases}>
          <RealtimeProvider client={realtimeClient}>{children}</RealtimeProvider>
        </UseCasesProvider>
      </QueryClientProvider>
    ),
  };
}

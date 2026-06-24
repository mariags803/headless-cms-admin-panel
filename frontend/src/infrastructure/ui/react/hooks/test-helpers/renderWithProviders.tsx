import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { DomainEvent } from '@cms/shared';
import { UseCasesProvider, type UseCases } from '../../providers/UseCasesProvider';
import { RealtimeProvider } from '../../providers/RealtimeProvider';
import type { SseClient } from '../../../../realtime/SseClient';

export function fakeRealtimeClient() {
  const listeners = new Set<(event: DomainEvent) => void>();
  return {
    client: {
      subscribe: (listener: (event: DomainEvent) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    } as unknown as SseClient,
    emit: (event: DomainEvent) => {
      for (const listener of listeners) listener(event);
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

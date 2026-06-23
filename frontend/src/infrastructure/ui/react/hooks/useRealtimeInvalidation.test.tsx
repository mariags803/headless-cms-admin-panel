import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { DomainEvent } from '../../../../domain/events/DomainEvent';
import { RealtimeProvider } from '../providers/RealtimeProvider';
import { useRealtimeInvalidation } from './useRealtimeInvalidation';
import { entryKeys, schemaKeys } from './queryKeys';

function fakeClient() {
  const listeners = new Set<(event: DomainEvent) => void>();
  return {
    client: {
      subscribe: jest.fn((listener: (event: DomainEvent) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
    },
    emit: (event: DomainEvent) => {
      for (const listener of listeners) listener(event);
    },
  };
}

function renderWithClient(emitClient: ReturnType<typeof fakeClient>['client']) {
  const queryClient = new QueryClient();
  jest.spyOn(queryClient, 'invalidateQueries');

  renderHook(() => useRealtimeInvalidation(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider client={emitClient as never}>{children}</RealtimeProvider>
      </QueryClientProvider>
    ),
  });

  return queryClient;
}

describe('useRealtimeInvalidation', () => {
  it('invalidates the schemas list and detail on schema.created', () => {
    const { client, emit } = fakeClient();
    const queryClient = renderWithClient(client);

    emit({
      type: 'schema.created',
      schema: { id: 's1', name: 'Car', fields: [], createdAt: '', updatedAt: '' },
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: schemaKeys.list() });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: schemaKeys.detail('s1') });
  });

  it('invalidates the schemas list and detail on schema.deleted', () => {
    const { client, emit } = fakeClient();
    const queryClient = renderWithClient(client);

    emit({ type: 'schema.deleted', schemaId: 's1' });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: schemaKeys.list() });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: schemaKeys.detail('s1') });
  });

  it('invalidates the entries list and detail on entry.updated', () => {
    const { client, emit } = fakeClient();
    const queryClient = renderWithClient(client);

    emit({
      type: 'entry.updated',
      entry: { id: 'e1', schemaId: 's1', data: {}, createdAt: '', updatedAt: '' },
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: entryKeys.list('s1') });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: entryKeys.detail('s1', 'e1') });
  });

  it('invalidates the entries list and detail on entry.deleted', () => {
    const { client, emit } = fakeClient();
    const queryClient = renderWithClient(client);

    emit({ type: 'entry.deleted', entryId: 'e1', schemaId: 's1' });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: entryKeys.list('s1') });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: entryKeys.detail('s1', 'e1') });
  });
});

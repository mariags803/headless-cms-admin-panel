import { renderHook } from '@testing-library/react';
import type { DomainEvent } from '../../../../domain/events/DomainEvent';
import { RealtimeProvider } from '../providers/RealtimeProvider';
import { useRealtime } from './useRealtime';

function fakeClient() {
  const listeners = new Set<(event: DomainEvent) => void>();
  const unsubscribe = jest.fn();
  return {
    client: {
      subscribe: jest.fn((listener: (event: DomainEvent) => void) => {
        listeners.add(listener);
        return unsubscribe;
      }),
    },
    emit: (event: DomainEvent) => {
      for (const listener of listeners) listener(event);
    },
    unsubscribe,
  };
}

describe('useRealtime', () => {
  it('subscribes to the client and forwards events to onEvent', () => {
    const { client, emit } = fakeClient();
    const onEvent = jest.fn();

    renderHook(() => useRealtime(onEvent), {
      wrapper: ({ children }) => (
        <RealtimeProvider client={client as never}>{children}</RealtimeProvider>
      ),
    });

    expect(client.subscribe).toHaveBeenCalledTimes(1);

    emit({ type: 'schema.deleted', schemaId: 's1' });

    expect(onEvent).toHaveBeenCalledWith({ type: 'schema.deleted', schemaId: 's1' });
  });

  it('unsubscribes on unmount', () => {
    const { client, unsubscribe } = fakeClient();

    const { unmount } = renderHook(() => useRealtime(() => {}), {
      wrapper: ({ children }) => (
        <RealtimeProvider client={client as never}>{children}</RealtimeProvider>
      ),
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('throws when used without a RealtimeProvider', () => {
    expect(() => {
      renderHook(() => useRealtime(() => {}));
    }).toThrow('useRealtimeClient must be used within a RealtimeProvider');
  });
});

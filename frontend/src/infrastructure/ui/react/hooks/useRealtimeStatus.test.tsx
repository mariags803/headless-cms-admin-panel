import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RealtimeProvider } from '../providers/RealtimeProvider';
import { fakeRealtimeClient } from './test-helpers/renderWithProviders';
import { useRealtimeStatus } from './useRealtimeStatus';

describe('useRealtimeStatus', () => {
  it('returns the client status and updates when it changes', () => {
    const realtime = fakeRealtimeClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RealtimeProvider client={realtime.client}>{children}</RealtimeProvider>
    );

    const { result } = renderHook(() => useRealtimeStatus(), { wrapper });

    expect(result.current).toBe('open');

    act(() => realtime.setStatus('closed'));

    expect(result.current).toBe('closed');
  });
});

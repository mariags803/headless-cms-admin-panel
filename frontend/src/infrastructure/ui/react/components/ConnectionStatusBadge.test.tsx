import { act, render, screen } from '@testing-library/react';
import { RealtimeProvider } from '../providers/RealtimeProvider';
import { fakeRealtimeClient } from '../hooks/test-helpers/renderWithProviders';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';

describe('ConnectionStatusBadge', () => {
  it('renders nothing while open', () => {
    const realtime = fakeRealtimeClient();
    render(
      <RealtimeProvider client={realtime.client}>
        <ConnectionStatusBadge />
      </RealtimeProvider>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders nothing while connecting', () => {
    const realtime = fakeRealtimeClient();
    realtime.setStatus('connecting');
    render(
      <RealtimeProvider client={realtime.client}>
        <ConnectionStatusBadge />
      </RealtimeProvider>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a message once the connection is closed', () => {
    const realtime = fakeRealtimeClient();
    render(
      <RealtimeProvider client={realtime.client}>
        <ConnectionStatusBadge />
      </RealtimeProvider>,
    );

    act(() => realtime.setStatus('closed'));

    expect(screen.getByRole('status')).toHaveTextContent(/conexión en tiempo real perdida/i);
  });
});

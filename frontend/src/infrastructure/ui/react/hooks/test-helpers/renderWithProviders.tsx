import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { UseCasesProvider, type UseCases } from '../../providers/UseCasesProvider';

export function makeWrapper(useCases: UseCases) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <UseCasesProvider useCases={useCases}>{children}</UseCasesProvider>
      </QueryClientProvider>
    ),
  };
}

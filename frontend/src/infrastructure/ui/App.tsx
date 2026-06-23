import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './AppRoutes'
import { SseClient } from '../realtime/SseClient'
import { RealtimeProvider } from './react/providers/RealtimeProvider'
import { UseCasesProvider } from './react/providers/UseCasesProvider'
import { useRealtimeInvalidation } from './react/hooks/useRealtimeInvalidation'

function RealtimeInvalidationBoundary({ children }: { children: React.ReactNode }) {
  useRealtimeInvalidation()
  return children
}

function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [sseClient] = useState(() => new SseClient())

  return (
    <QueryClientProvider client={queryClient}>
      <UseCasesProvider>
        <RealtimeProvider client={sseClient}>
          <RealtimeInvalidationBoundary>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </RealtimeInvalidationBoundary>
        </RealtimeProvider>
      </UseCasesProvider>
    </QueryClientProvider>
  )
}

export default App

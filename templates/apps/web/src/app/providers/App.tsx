import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, createClient } from '../trpc'
import { MainPage } from '../../pages/main'
import '../../shared/styles.css'

const queryClient = new QueryClient()
const trpcClient = createClient()

export function AppProvider() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MainPage />
      </QueryClientProvider>
    </trpc.Provider>
  )
}



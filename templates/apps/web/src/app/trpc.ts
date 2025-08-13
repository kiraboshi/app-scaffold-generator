import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import type { AppRouter } from '@__SCOPE__/server'

export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>()

export function createClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({ url: '/trpc' }),
    ],
  })
}



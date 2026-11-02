import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A failed search should not silently retry; the user decides to retry.
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { queryClient } from '@/lib/query-client'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  )
}

import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { queryClient } from '@/lib/query-client'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1b6c80',
          colorText: '#131416',
          colorTextSecondary: '#5d5f60',
          colorBorder: '#e8eaec',
          borderRadius: 6,
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  )
}

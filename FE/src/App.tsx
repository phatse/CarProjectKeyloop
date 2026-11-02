import { Layout, Typography } from 'antd'
import { AppProviders } from '@/app/providers'
import { DocumentViewer } from '@/app/routes/DocumentViewer'

export default function App() {
  return (
    <AppProviders>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Layout.Header style={{ background: '#001529' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0, lineHeight: '64px' }}>
            CarProject
          </Typography.Title>
        </Layout.Header>
        <Layout.Content style={{ padding: '48px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <DocumentViewer />
          </div>
        </Layout.Content>
      </Layout>
    </AppProviders>
  )
}

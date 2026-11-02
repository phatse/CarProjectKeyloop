import { Layout, Typography } from 'antd'
import { AppProviders } from '@/app/providers'
import { DocumentViewer } from '@/app/routes/DocumentViewer'

export default function App() {
  return (
    <AppProviders>
      <Layout style={{ minHeight: '100vh', background: 'var(--ground)' }}>
        <Layout.Header
          style={{
            background: 'var(--ground)',
            paddingInline: 24,
            height: 48,
            lineHeight: '48px',
            borderBottom: 'none',
          }}
        >
          <Typography.Text strong style={{ letterSpacing: '0.02em' }}>
            CarProject
          </Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
            Dealership documents
          </Typography.Text>
        </Layout.Header>
        <Layout.Content style={{ padding: '0 var(--sheet-inset) var(--sheet-inset) 0' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <DocumentViewer />
          </div>
        </Layout.Content>
      </Layout>
    </AppProviders>
  )
}

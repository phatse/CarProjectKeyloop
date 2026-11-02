import { Card, List, Typography } from 'antd'
import type { Document } from '@/features/documents/types/document'
import { SourceTag } from './SourceTag'

type DocumentListProps = {
  documents: Document[]
}

const formatAmount = (document: Document): string | null => {
  if (document.amount === null) {
    return null
  }

  const formatted = document.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return document.currency === null ? formatted : `${document.currency} ${formatted}`
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <List
      itemLayout="horizontal"
      dataSource={documents}
      rowKey="id"
      style={{ marginTop: 8 }}
      renderItem={(document) => {
        const amount = formatAmount(document)

        return (
          <List.Item style={{ paddingInline: 0 }}>
            <Card style={{ width: '100%' }} styles={{ body: { padding: '16px 20px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <Typography.Text strong>{document.title}</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <SourceTag source={document.source} />
                    <Typography.Text type="secondary">
                      {document.type} · {document.issuedAt}
                      {amount === null ? '' : ` · ${amount}`}
                    </Typography.Text>
                  </div>
                </div>
                {document.url === null ? null : (
                  <Typography.Link href={document.url} target="_blank" rel="noreferrer">
                    Open
                  </Typography.Link>
                )}
              </div>
            </Card>
          </List.Item>
        )
      }}
    />
  )
}

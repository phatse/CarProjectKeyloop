import { Table, Typography } from 'antd'
import type { Document } from '@/features/documents/types/document'
import { MONO_FONT } from '@/features/documents/utils/typography'
import { SourceTag } from './SourceTag'

type DocumentListProps = {
  documents: Document[]
}

const formatAmount = (document: Document): string => {
  if (document.amount === null) {
    return '—'
  }

  const formatted = document.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return document.currency === null ? formatted : `${document.currency} ${formatted}`
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <Table<Document>
      dataSource={documents}
      rowKey="id"
      pagination={false}
      size="middle"
      columns={[
        {
          title: 'Document',
          dataIndex: 'title',
          render: (title: string) => <Typography.Text strong>{title}</Typography.Text>,
        },
        {
          title: 'Source',
          dataIndex: 'source',
          width: 120,
          render: (source: Document['source']) => <SourceTag source={source} />,
        },
        {
          title: 'Type',
          dataIndex: 'type',
          width: 180,
          render: (type: string) => <Typography.Text type="secondary">{type}</Typography.Text>,
        },
        {
          title: 'Issued',
          dataIndex: 'issuedAt',
          width: 130,
          render: (issuedAt: string) => <span style={{ fontFamily: MONO_FONT }}>{issuedAt}</span>,
        },
        {
          title: 'Amount',
          key: 'amount',
          width: 160,
          align: 'right',
          render: (_, document) => (
            <span style={{ fontFamily: MONO_FONT }}>{formatAmount(document)}</span>
          ),
        },
        {
          title: '',
          key: 'link',
          width: 80,
          render: (_, document) =>
            document.url === null ? null : (
              <Typography.Link href={document.url} target="_blank" rel="noreferrer">
                Open
              </Typography.Link>
            ),
        },
      ]}
    />
  )
}

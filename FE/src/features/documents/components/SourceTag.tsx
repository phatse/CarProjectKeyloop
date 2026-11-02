import { Tag } from 'antd'
import type { DocumentSource } from '@/features/documents/types/document'

const sourceLabel: Record<DocumentSource, string> = {
  SALES: 'Sales',
  SERVICE: 'Service',
}

type SourceTagProps = {
  source: DocumentSource
}

export function SourceTag({ source }: SourceTagProps) {
  return (
    <Tag
      variant="outlined"
      style={{
        margin: 0,
        color: 'var(--accent)',
        borderColor: 'var(--accent)',
        background: 'transparent',
      }}
    >
      {sourceLabel[source]}
    </Tag>
  )
}

import { Tag } from 'antd'
import type { DocumentSource } from '@/features/documents/types/document'

const sourceLabel: Record<DocumentSource, { label: string; color: string }> = {
  SALES: { label: 'Sales', color: 'blue' },
  SERVICE: { label: 'Service', color: 'green' },
}

type SourceTagProps = {
  source: DocumentSource
}

export function SourceTag({ source }: SourceTagProps) {
  const { label, color } = sourceLabel[source]

  return <Tag color={color}>{label}</Tag>
}

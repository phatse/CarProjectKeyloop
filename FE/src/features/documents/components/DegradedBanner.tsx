import { Alert } from 'antd'
import type { DocumentSource, SourceStatus } from '@/features/documents/types/document'
import { sourceLabel } from '@/features/documents/utils/source-label'

const statusText: Record<Exclude<SourceStatus, 'OK'>, string> = {
  TIMEOUT: 'timed out',
  ERROR: 'unavailable',
  INVALID_PAYLOAD: 'returned data we could not read',
}

type DegradedBannerProps = {
  sources: Record<DocumentSource, SourceStatus>
}

export function DegradedBanner({ sources }: DegradedBannerProps) {
  const failed = (Object.entries(sources) as [DocumentSource, SourceStatus][]).filter(
    (entry): entry is [DocumentSource, Exclude<SourceStatus, 'OK'>] => entry[1] !== 'OK',
  )

  return (
    <Alert
      type="warning"
      showIcon
      title="Some documents may be missing"
      description={failed
        .map(([source, status]) => `${sourceLabel[source]} ${statusText[status]}.`)
        .join(' ')}
    />
  )
}

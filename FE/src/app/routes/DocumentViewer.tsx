import { Alert, Empty, Skeleton, Typography } from 'antd'
import { useState } from 'react'
import { DegradedBanner } from '@/features/documents/components/DegradedBanner'
import { DocumentList } from '@/features/documents/components/DocumentList'
import { VinSearchForm } from '@/features/documents/components/VinSearchForm'
import { useVehicleDocuments } from '@/features/documents/hooks/useVehicleDocuments'

export function DocumentViewer() {
  const [vin, setVin] = useState('')
  const { data, isFetching, isError } = useVehicleDocuments(vin)

  return (
    <>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        Vehicle documents
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 32 }}>
        Search by VIN to see every document from Sales and Service in one list.
      </Typography.Paragraph>
      <VinSearchForm onSearch={setVin} />
      <div style={{ marginTop: 32 }}>
        {isFetching ? <Skeleton active /> : null}
        {isError ? (
          <Alert
            type="error"
            showIcon
            title="Search failed"
            description="The document service did not respond. Try again."
          />
        ) : null}
        {data && data.meta.status === 'PARTIAL' ? (
          <DegradedBanner sources={data.meta.sources} />
        ) : null}
        {data && data.documents.length > 0 ? <DocumentList documents={data.documents} /> : null}
        {data && data.documents.length === 0 && !isError ? (
          <Empty description={`No documents found for ${data.vin}`} style={{ marginTop: 48 }} />
        ) : null}
      </div>
    </>
  )
}

import { useQuery } from '@tanstack/react-query'
import { getDocuments } from '@/features/documents/api/get-documents'

export const vehicleDocumentsQueryKey = (vin: string): readonly [string, string] => [
  'vehicle-documents',
  vin,
]

export const useVehicleDocuments = (vin: string) =>
  useQuery({
    queryKey: vehicleDocumentsQueryKey(vin),
    queryFn: () => getDocuments(vin),
    enabled: vin.length > 0,
  })

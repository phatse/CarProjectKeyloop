import type { DocumentsResponse } from '@/features/documents/types/document'
import { http } from '@/lib/http'

export const getDocuments = async (vin: string): Promise<DocumentsResponse> => {
  const response = await http.get<DocumentsResponse>(`/api/v1/vehicles/${vin}/documents`)

  return response.data
}

import { headers } from 'next/headers'
import { getApiBaseUrl } from '@/lib/api'

export async function getInventoryFromBackendApi() {
  const baseUrl = getApiBaseUrl()

  if (!baseUrl) {
    return null
  }

  const cookie = headers().get('cookie') || ''
  const response = await fetch(`${baseUrl}/api/inventory`, {
    headers: {
      cookie,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Inventory API returned ${response.status}`)
  }

  return response.json()
}

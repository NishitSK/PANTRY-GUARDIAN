/**
 * Get the API base URL for making backend requests
 * Client side: always use same-origin paths and rely on Next.js rewrites.
 * Server side: use NEXT_PUBLIC_API_URL when present.
 */
export function getApiBaseUrl(): string {
  // Keep browser requests same-origin so rewrites can proxy to backend.
  if (typeof window !== 'undefined') {
    return ''
  }

  // Server-side calls may need an absolute URL.
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }

  return ''
}

/**
 * Helper function to make API requests with the correct base URL
 */
export async function apiRequest(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

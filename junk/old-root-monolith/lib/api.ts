/**
 * Get the API base URL for making backend requests
 * In development: uses relative paths (Next.js API routes or local backend)
 * In production: uses NEXT_PUBLIC_API_URL if set, otherwise relative paths
 */
export function getApiBaseUrl(): string {
  // If NEXT_PUBLIC_API_URL is set, use it (for Vercel + Render setup)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Otherwise use relative paths (monolith deployment or local dev)
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

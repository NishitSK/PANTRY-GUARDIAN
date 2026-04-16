'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiBaseUrl } from '@/lib/api'

const ROUTES_TO_PREFETCH = [
  '/dashboard',
  '/inventory',
  '/add',
  '/insights',
  '/recipes',
  '/settings',
]

const ENDPOINTS_TO_WARM = [
  '/api/user/profile',
  '/api/inventory',
  '/api/products',
  '/api/storage-methods',
]

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    await fetch(url, {
      signal: controller.signal,
      credentials: 'include',
      cache: 'no-store',
    })
  } catch {
    // Ignore warmup failures; this is best-effort only.
  } finally {
    clearTimeout(timeout)
  }
}

export default function RouteWarmup() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const key = 'pg:warmup:v1'
    if (sessionStorage.getItem(key) === 'done') return

    const runWarmup = async () => {
      sessionStorage.setItem(key, 'done')

      for (const route of ROUTES_TO_PREFETCH) {
        router.prefetch(route)
      }

      const baseUrl = getApiBaseUrl()
      await Promise.allSettled(
        ENDPOINTS_TO_WARM.map((endpoint) => fetchWithTimeout(`${baseUrl}${endpoint}`, 8000))
      )
    }

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }

    let idleId: number | undefined
    let timeoutId: number | undefined

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(() => {
        void runWarmup()
      })
    } else {
      timeoutId = window.setTimeout(() => {
        void runWarmup()
      }, 1200)
    }

    return () => {
      if (idleId !== undefined && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [router])

  return null
}

'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getInventoryChangedAt } from '@/lib/inventoryInvalidation'

const INVENTORY_DEPENDENT_ROUTES = new Set([
  '/dashboard',
  '/recipes',
  '/insights',
])

export default function RefreshAfterInventoryChange() {
  const pathname = usePathname()
  const router = useRouter()
  const lastRefreshKey = useRef<string | null>(null)

  useEffect(() => {
    if (!INVENTORY_DEPENDENT_ROUTES.has(pathname)) return

    const changedAt = getInventoryChangedAt()
    if (!changedAt || lastRefreshKey.current === `${pathname}:${changedAt}`) return

    lastRefreshKey.current = `${pathname}:${changedAt}`
    router.refresh()
  }, [pathname, router])

  return null
}

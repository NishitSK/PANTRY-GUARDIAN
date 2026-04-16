'use client'

import { useEffect, useMemo, useState } from 'react'
import { getApiBaseUrl } from '@/lib/api'

type InventoryApiItem = {
  _id: string
  purchasedAt: string
  openedAt?: string | null
  productId?: {
    name?: string
    baseShelfLifeDays?: number
    roomTempShelfLifeDays?: number | null
    fridgeShelfLifeDays?: number | null
    freezerShelfLifeDays?: number | null
  }
  storageMethodId?: {
    name?: string
  }
}

type SpoilageAlert = {
  id: string
  name: string
  daysLeft: number
  status: 'expiring' | 'expired'
}

const CHECK_INTERVAL_MS = 10 * 60 * 1000
const SPOILAGE_DISMISSED_KEY = 'pg:spoilage:notifier-dismissed'

function computeDaysLeft(item: InventoryApiItem): number | null {
  const product = item.productId
  const storage = item.storageMethodId
  if (!product || !storage || !item.purchasedAt) return null

  let shelfLife = product.baseShelfLifeDays ?? 0
  const storageName = (storage.name || '').toLowerCase()

  if (storageName.includes('freezer') && product.freezerShelfLifeDays != null) {
    shelfLife = product.freezerShelfLifeDays
  } else if ((storageName.includes('fridge') || storageName.includes('refrig')) && product.fridgeShelfLifeDays != null) {
    shelfLife = product.fridgeShelfLifeDays
  } else if (storageName.includes('room') && product.roomTempShelfLifeDays != null) {
    shelfLife = product.roomTempShelfLifeDays
  }

  if (item.openedAt) {
    shelfLife = Math.floor(shelfLife * 0.75)
  }

  const purchaseDate = new Date(item.purchasedAt)
  const expiryDate = new Date(purchaseDate)
  expiryDate.setDate(expiryDate.getDate() + shelfLife)

  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return daysLeft
}

function getAlerts(items: InventoryApiItem[]): SpoilageAlert[] {
  return items
    .map((item) => {
      const daysLeft = computeDaysLeft(item)
      if (daysLeft == null) return null

      if (daysLeft < 0) {
        return {
          id: item._id,
          name: item.productId?.name || 'Item',
          daysLeft,
          status: 'expired' as const,
        }
      }

      if (daysLeft <= 2) {
        return {
          id: item._id,
          name: item.productId?.name || 'Item',
          daysLeft,
          status: 'expiring' as const,
        }
      }

      return null
    })
    .filter((a): a is SpoilageAlert => a !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4)
}

export default function SpoilageNotifier() {
  const [alerts, setAlerts] = useState<SpoilageAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SPOILAGE_DISMISSED_KEY) === '1') {
      setDismissed(true)
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(window.Notification.permission)
    }

    const run = async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const response = await fetch(`${baseUrl}/api/inventory`, { cache: 'no-store' })
        if (!response.ok) return

        const data = (await response.json()) as InventoryApiItem[]
        const nextAlerts = getAlerts(data)
        setAlerts(nextAlerts)

        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
          nextAlerts.forEach((alert) => {
            const key = `pg:spoilage:${alert.id}:${alert.daysLeft}`
            if (!localStorage.getItem(key)) {
              const body =
                alert.status === 'expired'
                  ? `${alert.name} has expired. Use or discard it now.`
                  : `${alert.name} may spoil in ${alert.daysLeft} day${alert.daysLeft === 1 ? '' : 's'}.`

              new window.Notification('Pantry Guardian Alert', { body })
              localStorage.setItem(key, String(Date.now()))
            }
          })
        }
      } catch {
        // Best effort notifier; fail silently.
      } finally {
        setLoading(false)
      }
    }

    void run()
    const interval = window.setInterval(() => {
      void run()
    }, CHECK_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [])

  const hasAlerts = alerts.length > 0

  const heading = useMemo(() => {
    const expiredCount = alerts.filter((a) => a.status === 'expired').length
    if (expiredCount > 0) {
      return `${expiredCount} item${expiredCount > 1 ? 's are' : ' is'} spoiled`
    }
    return 'Items nearing spoilage'
  }, [alerts])

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const next = await window.Notification.requestPermission()
    setPermission(next)
  }

  if (loading || !hasAlerts || dismissed) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] border-4 border-black bg-white shadow-[8px_8px_0_#000]">
      <div className="flex items-center justify-between border-b-2 border-black bg-[#FFE66D] px-4 py-3">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black">{heading}</p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(SPOILAGE_DISMISSED_KEY, '1')
            }
          }}
          aria-label="Close spoilage alert"
          className="h-7 w-7 border-2 border-black bg-white text-sm font-black leading-none text-black hover:bg-black hover:text-white"
        >
          X
        </button>
      </div>

      <div className="max-h-64 overflow-auto p-3 space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="border-2 border-black px-3 py-2 bg-[#F6F1E7]">
            <p className="text-sm font-black text-black">{alert.name}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-black/75">
              {alert.status === 'expired'
                ? `Expired ${Math.abs(alert.daysLeft)} day${Math.abs(alert.daysLeft) === 1 ? '' : 's'} ago`
                : `Spoils in ${alert.daysLeft} day${alert.daysLeft === 1 ? '' : 's'}`}
            </p>
          </div>
        ))}
      </div>

      {permission === 'default' && (
        <div className="border-t-2 border-black p-3 bg-[#93E1A8]">
          <button
            type="button"
            onClick={requestPermission}
            className="w-full border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-black hover:bg-black hover:text-white"
          >
            Enable Browser Alerts
          </button>
        </div>
      )}
    </div>
  )
}

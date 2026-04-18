'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2, CheckCircle2, ArrowUpDown, MoreHorizontal, LayoutGrid, List } from 'lucide-react'
import { SkeletonInventoryRow, SkeletonInventoryCard } from '@/components/ui/SkeletonCard'
import { cn } from '@/lib/utils'
import ExpiringSoonCarousel from '@/components/dashboard/ExpiringSoonCarousel'
import { motion, AnimatePresence } from 'framer-motion'
import { normalizeCategory, getCategoryDisplayLabel, CANONICAL_CATEGORIES } from '@/lib/categoryNormalizer'
import { getScoreLabel, calculateShelfLife } from '@/lib/shelfLifeDb'
import { getApiBaseUrl } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryItem {
  _id: string
  productId: {
    _id: string
    name: string
    category: string
    baseShelfLifeDays: number
    fridgeShelfLifeDays?: number
    freezerShelfLifeDays?: number
    roomTempShelfLifeDays?: number
  }
  storageMethodId: {
    _id: string
    name: string
  }
  quantity: number
  unit: string
  purchasedAt: string
  openedAt?: string
  notes?: string
  source?: 'manual' | 'receipt_scan'
  // computed client-side
  expiryDate?: string
  daysLeft?: number
  status?: 'good' | 'expiring_soon' | 'urgent' | 'expired'
  shelfLifeDays?: number
  storageSuggestion?: string
}

type SortKey = 'expiry' | 'name' | 'added' | 'condition'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeStatus(daysLeft: number): InventoryItem['status'] {
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 2) return 'urgent'
  if (daysLeft <= 7) return 'expiring_soon'
  return 'good'
}

function statusLabel(status: InventoryItem['status'], daysLeft: number, scoreLabel: string) {
  if (status === 'expired') return `Expired ${Math.abs(daysLeft)}d ago`
  if (status === 'urgent') return daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft}d`
  if (status === 'expiring_soon') return `Expires in ${daysLeft}d`
  // Pantry/quality items: don't say "Fresh" — say "Good" or storage-specific
  if (scoreLabel === 'Pantry health' || scoreLabel === 'Condition') return 'Prime'
  if (scoreLabel === 'Shelf life') return 'In stock'
  if (scoreLabel === 'Quality') return 'Good quality'
  return 'Fresh'
}

function statusBg(status: InventoryItem['status']) {
  if (status === 'expired') return 'bg-[#FFD2CC] text-red-900'
  if (status === 'urgent') return 'bg-[#FFAB40] text-black'
  if (status === 'expiring_soon') return 'bg-[#FFE66D] text-black'
  return 'bg-[#93E1A8] text-black'
}

function statusDot(status: InventoryItem['status']) {
  if (status === 'expired') return 'bg-red-700'
  if (status === 'urgent') return 'bg-orange-700'
  if (status === 'expiring_soon') return 'bg-yellow-700'
  return 'bg-green-700'
}

function categoryIcon(canonical: string) {
  const map: Record<string, string> = {
    Vegetables: 'bg-green-50 text-green-800',
    Fruits: 'bg-orange-50 text-orange-800',
    Dairy: 'bg-blue-50 text-blue-800',
    Meat: 'bg-red-50 text-red-800',
    Grains: 'bg-amber-50 text-amber-800',
    Pantry: 'bg-yellow-50 text-yellow-800',
    Frozen: 'bg-sky-50 text-sky-800',
    Beverages: 'bg-purple-50 text-purple-800',
  }
  return map[canonical] || 'bg-stone-100 text-stone-700'
}

function storageBadge(name?: string) {
  const n = (name || '').toLowerCase()
  if (n.includes('freezer')) return 'bg-[#1E3A8A] text-white'
  if (n.includes('fridge') || n.includes('refrig')) return 'bg-[#BFE7FF] text-black'
  return 'bg-[#FFE66D] text-black'
}

function getConditionScore(daysLeft: number, shelfLife: number) {
  if (daysLeft <= 0) return 0
  return Math.min(100, Math.round((daysLeft / Math.max(shelfLife, 1)) * 100))
}

function getPurchaseDayKey(purchasedAt: string) {
  const date = new Date(purchasedAt)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toISOString().split('T')[0]
}

function formatPurchaseDayLabel(dayKey: string) {
  if (dayKey === 'unknown') return 'Unknown purchase date'
  const date = new Date(`${dayKey}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDayHueStyle(dayKey: string) {
  if (dayKey === 'unknown') {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
    }
  }

  let hash = 0
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) % 360
  }

  return {
    backgroundColor: `hsla(${hash}, 75%, 94%, 0.92)`,
    borderColor: `hsla(${hash}, 45%, 42%, 0.9)`,
  }
}

function enhanceItem(item: any): InventoryItem {
  const product = item.productId
  const storage = item.storageMethodId
  const purchasedAt = new Date(item.purchasedAt)
  const storageName = storage?.name || 'Room Temp'
  const shelfLife = calculateShelfLife(product, storageName, !!item.openedAt)

  const expiryDate = new Date(purchasedAt)
  expiryDate.setDate(expiryDate.getDate() + shelfLife)
  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const status = computeStatus(daysLeft)

  const methods = [
    { key: 'room', label: 'Room Temp', days: product.roomTempShelfLifeDays ?? product.baseShelfLifeDays },
    { key: 'fridge', label: 'Refrigerator', days: product.fridgeShelfLifeDays ?? product.baseShelfLifeDays },
    { key: 'freezer', label: 'Freezer', days: product.freezerShelfLifeDays ?? product.baseShelfLifeDays },
  ]
  const currentKey = storageName.includes('freezer') ? 'freezer'
    : storageName.includes('fridge') || storageName.includes('refrig') ? 'fridge' : 'room'
  const current = methods.find(m => m.key === currentKey)!
  const best = methods.reduce((a, b) => b.days > a.days ? b : a, methods[0])

  // Only suggest storage change if:
  // - item is actually at risk (≤30% remaining OR ≤14 days left)
  // - gain is meaningful (best option adds ≥25% more shelf life)
  let storageSuggestion: string | undefined
  const pct = getConditionScore(daysLeft, shelfLife)
  const gainDays = current ? best.days - current.days : 0
  const gainPct = current && current.days > 0 ? gainDays / current.days : 0
  if ((pct <= 30 || daysLeft <= 14) && gainDays > 0 && gainPct >= 0.25) {
    storageSuggestion = `Move to ${best.label} to extend by ~${gainDays} day(s).`
  }

  return { ...item, expiryDate: expiryDate.toISOString(), daysLeft, status, shelfLifeDays: shelfLife, storageSuggestion }
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ item, onClose, onSaved }: { item: InventoryItem; onClose: () => void; onSaved: (updated: InventoryItem) => void }) {
  const [qty, setQty] = useState(String(item.quantity))
  const [unit, setUnit] = useState(item.unit)
  const [opened, setOpened] = useState(item.openedAt ? item.openedAt.split('T')[0] : '')
  const [notes, setNotes] = useState(item.notes || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const baseUrl = getApiBaseUrl()

  const handleSave = async () => {
    setSaving(true)
    setErr('')
    try {
      const res = await fetch(`${baseUrl}/api/inventory/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(qty),
          unit,
          openedAt: opened || null,
          notes,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save')
      }
      const updated = await res.json()
      onSaved(enhanceItem(updated))
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#F6F1E7] border-4 border-black shadow-[12px_12px_0_#000]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-4 border-black bg-[#FFE66D] px-6 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60">Edit item</p>
            <h2 className="font-noto-serif text-xl font-bold text-black">{item.productId?.name}</h2>
          </div>
          <button onClick={onClose} className="border-2 border-black bg-white p-2 hover:bg-black hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {err && (
            <div className="border-2 border-black bg-[#FFD2CC] px-4 py-2 text-sm font-manrope text-black">{err}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1">Quantity</label>
              <input
                type="number" min="0" step="0.1"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-sm focus:outline-none focus:bg-[#FFE66D]/30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-sm focus:outline-none"
              >
                {['pieces', 'kg', 'g', 'L', 'mL', 'packages', 'bottles', 'cans', 'bunches', 'sticks', 'grams', 'dozen'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
                {!['pieces', 'kg', 'g', 'L', 'mL', 'packages', 'bottles', 'cans', 'bunches', 'sticks', 'grams', 'dozen'].includes(unit) && (
                  <option value={unit}>{unit}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              Opened on <span className="text-black/40 normal-case tracking-normal text-[9px]">(leave blank if still sealed)</span>
            </label>
            <input
              type="date"
              value={opened}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setOpened(e.target.value)}
              className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-sm focus:outline-none resize-none"
              placeholder="Optional notes…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="border-2 border-black bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 border-2 border-black bg-[#FFE66D] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0_#000] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Freshness Explainer Row ──────────────────────────────────────────────────

function ConditionExplainer({ item }: { item: InventoryItem }) {
  const pct = getConditionScore(item.daysLeft ?? 0, item.shelfLifeDays ?? 14)
  const purchased = new Date(item.purchasedAt).toLocaleDateString()
  const expiry = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'
  const scoreLabel = getScoreLabel(item.productId?.category || '', item.productId?.name || '')

  return (
    <div className="bg-white border-t-2 border-black px-10 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px]">
      <div>
        <p className="font-black uppercase tracking-[0.16em] text-black/50 mb-0.5">Storage</p>
        <p className="font-black text-black">{item.storageMethodId?.name || 'Room Temp'}</p>
      </div>
      <div>
        <p className="font-black uppercase tracking-[0.16em] text-black/50 mb-0.5">Purchased</p>
        <p className="font-black text-black">{purchased}</p>
      </div>
      <div>
        <p className="font-black uppercase tracking-[0.16em] text-black/50 mb-0.5">Est. shelf life</p>
        <p className="font-black text-black">
          {item.shelfLifeDays}d
          {item.openedAt ? <span className="text-black/50 ml-1">(opened → ×0.75)</span> : null}
        </p>
      </div>
      <div>
        <p className="font-black uppercase tracking-[0.16em] text-black/50 mb-0.5">Est. expiry</p>
        <p className="font-black text-black">{expiry}</p>
      </div>
      <div className="col-span-2 sm:col-span-4">
        <p className="font-black uppercase tracking-[0.16em] text-black/50 mb-1">
          {scoreLabel} score = {Math.max(0, item.daysLeft ?? 0)}d remaining ÷ {item.shelfLifeDays}d shelf life = <span className="text-black">{pct}%</span>
        </p>
        {item.storageSuggestion && (
          <p className="text-[#93000A] font-black uppercase tracking-[0.12em]">💡 {item.storageSuggestion}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortKey>('expiry')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const baseUrl = getApiBaseUrl()

  // ── auth guard ──
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/auth/login')
  }, [isLoaded, isSignedIn, router])

  // ── fetch ──
  useEffect(() => {
    const fetchInventory = async () => {
      if (!isLoaded || !isSignedIn) return
      try {
        const res = await fetch(`${baseUrl}/api/inventory`)
        if (!res.ok) throw new Error('Failed to fetch inventory')
        const data = await res.json()
        setItems(data.map(enhanceItem))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (isLoaded && isSignedIn) fetchInventory()
  }, [isLoaded, isSignedIn, baseUrl])

  // ── filter + sort ──
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const name = item.productId?.name || ''
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())
      const canonical = normalizeCategory(item.productId?.category || '')
      const matchesCategory = categoryFilter === 'All' || canonical === categoryFilter
      return matchesSearch && matchesCategory
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'expiry') return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
      if (sortBy === 'name') return (a.productId?.name || '').localeCompare(b.productId?.name || '')
      if (sortBy === 'condition') {
        const fa = getConditionScore(a.daysLeft ?? 0, a.shelfLifeDays ?? 14)
        const fb = getConditionScore(b.daysLeft ?? 0, b.shelfLifeDays ?? 14)
        return fb - fa
      }
      // 'added': default createdAt desc — already sorted from API
      return 0
    })

    return result
  }, [items, searchTerm, categoryFilter, sortBy])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>()

    for (const item of filteredItems) {
      const key = getPurchaseDayKey(item.purchasedAt)
      const existing = groups.get(key) || []
      existing.push(item)
      groups.set(key, existing)
    }

    return Array.from(groups.entries()).map(([dayKey, groupItems]) => ({
      dayKey,
      label: formatPurchaseDayLabel(dayKey),
      hueStyle: getDayHueStyle(dayKey),
      items: groupItems,
    }))
  }, [filteredItems])

  const expiringSoonItems = useMemo(() =>
    items
      .filter(i => i.status === 'urgent' || i.status === 'expiring_soon' || i.status === 'expired')
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
      .slice(0, 5),
    [items]
  )

  // ── actions ──
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`${baseUrl}/api/inventory/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setItems(prev => prev.filter(i => i._id !== id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`${baseUrl}/api/inventory/${id}`, { method: 'DELETE' })
      ))
      setItems(prev => prev.filter(i => !selectedIds.has(i._id)))
      setSelectedIds(new Set())
      router.refresh()
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredItems.map(i => i._id)))
  }

  // ── skeleton ──
  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="max-w-[1400px] mx-auto py-6 md:py-10 px-2 sm:px-4">
          <div className="h-20 border-4 border-black bg-[#F6F1E7] animate-pulse mb-8 shadow-[8px_8px_0_#000]" />
          <div className="hidden xl:block bg-[#F4F4EF] overflow-hidden border-4 border-black shadow-[8px_8px_0_#000]">
            <div className="h-12 border-b-2 border-black bg-black/5 animate-pulse" />
            {[...Array(5)].map((_, i) => <SkeletonInventoryRow key={i} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:hidden">
            {[...Array(4)].map((_, i) => <SkeletonInventoryCard key={i} />)}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto py-6 md:py-10 px-2 sm:px-4">

        {/* ── Top Action Bar ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10 gap-4 sticky top-0 bg-[#F6F1E7] z-30 py-3 px-3 md:px-5 border-4 border-black shadow-[8px_8px_0_#000]">
          {/* Search */}
          <div className="relative flex-1 w-full max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 group-focus-within:text-black transition-colors" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search your pantry…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-black py-3 pl-11 pr-10 focus:outline-none font-manrope text-sm text-black placeholder:text-black/40"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); searchRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 border border-black bg-white hover:bg-black hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="h-4 w-4 text-black/60 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="border-2 border-black bg-white px-3 py-2.5 font-manrope font-black text-xs uppercase tracking-[0.12em] focus:outline-none"
            >
              <option value="expiry">Expiry (soonest)</option>
              <option value="freshness">Freshness %</option>
              <option value="name">Name (A–Z)</option>
              <option value="added">Recently Added</option>
            </select>
          </div>

          {/* Add */}
          <Link href="/add" className="shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-[#FFE66D] text-black px-6 py-3 border-2 border-black font-black text-sm shadow-[4px_4px_0_#000] flex items-center gap-2 hover:bg-black hover:text-white transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Item
            </motion.button>
          </Link>
        </div>

        {/* ── Expiring Soon ──────────────────────────────────── */}
        <ExpiringSoonCarousel items={expiringSoonItems.map(item => ({
          _id: item._id,
          name: item.productId?.name,
          category: item.productId?.category,
          daysLeft: item.daysLeft || 0,
          image: undefined,
        }))} />

        {/* ── Title + Filters ────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-noto-serif font-bold text-black mb-1">
              Inventory
              {items.length > 0 && (
                <span className="ml-3 text-lg font-manrope font-normal text-black/50">
                  {filteredItems.length} of {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <p className="text-black/60 font-manrope text-sm">Every ingredient tracked, nothing wasted.</p>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {CANONICAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'shrink-0 px-4 py-2 font-manrope font-black text-xs uppercase tracking-[0.12em] border-2 border-black whitespace-nowrap transition-all' ,
                  categoryFilter === cat
                    ? 'bg-[#93E1A8] text-black shadow-[3px_3px_0_#000]'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Toggle (Desktop only for switching, mobile always cards) */}
          <div className="hidden md:flex p-1 border-2 border-black bg-white shadow-[3px_3px_0_#000]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-all',
                viewMode === 'grid' ? 'bg-[#FFE66D]' : 'hover:bg-black/5'
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-all',
                viewMode === 'list' ? 'bg-[#FFE66D]' : 'hover:bg-black/5'
              )}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Grid/Card View ────────────────────────────── */}
        <div className="mb-10 space-y-6">
          {groupedItems.map((group) => (
            <section
              key={group.dayKey}
              className="border-4 border-black shadow-[6px_6px_0_#000]"
              style={group.hueStyle}
            >
              <div className="flex flex-col gap-2 border-b-2 border-black/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/55">Purchased together</p>
                  <h3 className="font-noto-serif text-2xl text-black">{group.label}</h3>
                </div>
                <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                  {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {group.items.map(item => {
                    const displayLabel = getCategoryDisplayLabel(item.productId?.category || '')
                    const canonical = normalizeCategory(item.productId?.category || '')
                    const pct = freshnessPercent(item.daysLeft ?? 0, item.shelfLifeDays ?? 14)
                    const isExpanded = expandedId === item._id
                    const scoreLabel = getScoreLabel(item.productId?.category || '', item.productId?.name || '')

                    return (
                      <div key={item._id} className="border-4 border-black bg-[#F4F4EF] shadow-[6px_6px_0_#000]">
                        {/* Header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/50">{displayLabel}</p>
                              <h3 className="mt-0.5 text-xl font-noto-serif font-bold text-black leading-tight truncate">
                                {item.productId?.name}
                              </h3>
                            </div>
                            <div className={cn('shrink-0 px-2.5 py-1 border-2 border-black text-[9px] font-black uppercase tracking-[0.18em]', statusBg(item.status))}>
                              {statusLabel(item.status, item.daysLeft ?? 0, scoreLabel)}
                            </div>
                          </div>

                          {/* Source badge */}
                          {item.source === 'receipt_scan' && (
                            <span className="mt-1.5 inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-black/70">
                              📷 Receipt scan
                            </span>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-manrope">
                            <div className="border-2 border-black bg-white p-2">
                              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/50">Storage</p>
                              <span className={cn('mt-1 inline-flex border border-black px-1.5 py-0.5 text-[9px] font-black uppercase', storageBadge(item.storageMethodId?.name))}>
                                {item.storageMethodId?.name || 'Room Temp'}
                              </span>
                            </div>
                            <div className="border-2 border-black bg-white p-2">
                              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/50">Quantity</p>
                              <p className="mt-1 font-bold text-black">{item.quantity} <span className="opacity-60 text-[9px]">{item.unit}</span></p>
                            </div>
                            <div className="col-span-2 border-2 border-black bg-white p-2">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/50">{scoreLabel}</p>
                                <span className="text-[9px] font-black text-black">{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-black/10 border border-black overflow-hidden">
                                <div
                                  className={cn('h-full transition-all', pct > 50 ? 'bg-[#93E1A8]' : pct > 20 ? 'bg-[#FFE66D]' : 'bg-[#FFAB40]')}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : item._id)}
                                className="mt-1.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-black/50 hover:text-black transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {isExpanded ? 'Hide breakdown' : 'How is this calculated?'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2 border-2 border-black bg-white p-3 text-[10px] space-y-1">
                              <p><span className="font-black text-black/50 uppercase tracking-[0.12em]">Storage:</span> {item.storageMethodId?.name}</p>
                              <p><span className="font-black text-black/50 uppercase tracking-[0.12em]">Purchased:</span> {new Date(item.purchasedAt).toLocaleDateString()}</p>
                              <p><span className="font-black text-black/50 uppercase tracking-[0.12em]">Shelf life:</span> {item.shelfLifeDays}d{item.openedAt ? ' (opened ×0.75)' : ''}</p>
                              <p><span className="font-black text-black/50 uppercase tracking-[0.12em]">Est. expiry:</span> {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}</p>
                              <p className="font-black text-black">Score: {Math.max(0, item.daysLeft ?? 0)}d ÷ {item.shelfLifeDays}d = {pct}%</p>
                              {item.storageSuggestion && <p className="text-[#93000A] font-black"> {item.storageSuggestion}</p>}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => setEditItem(item)}
                              className="flex-1 flex items-center justify-center gap-1.5 border-2 border-black bg-white py-2 text-[9px] font-black uppercase tracking-[0.14em] hover:bg-[#FFE66D] transition-colors"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${item.productId?.name}"?`)) handleDelete(item._id)
                              }}
                              disabled={deletingId === item._id}
                              className="flex-1 flex items-center justify-center gap-1.5 border-2 border-black bg-white py-2 text-[9px] font-black uppercase tracking-[0.14em] hover:bg-[#FFD2CC] transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" /> {deletingId === item._id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="hidden xl:block bg-transparent overflow-hidden">
                  <div className="grid grid-cols-12 px-8 py-4 text-[9px] font-black uppercase tracking-[0.28em] text-black border-b-2 border-black/30 bg-white/60 items-center">
                    <div className="col-span-1 flex items-center">
                      <button onClick={selectAll} title={selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect all' : 'Select all'}>
                        <div className={cn(
                          'h-4 w-4 border-2 border-black flex items-center justify-center transition-colors',
                          selectedIds.size > 0 && selectedIds.size === filteredItems.length ? 'bg-black' : 'bg-white'
                        )}>
                          {selectedIds.size > 0 && selectedIds.size === filteredItems.length && <div className="h-2 w-2 bg-white" />}
                        </div>
                      </button>
                    </div>
                    <div className="col-span-4">Item Details</div>
                    <div className="col-span-3 text-center">Status / Storage</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Condition</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  <div className="divide-y divide-black/10">
                    {group.items.map((item, idx) => {
                      const displayLabel = getCategoryDisplayLabel(item.productId?.category || '')
                      const canonical = normalizeCategory(item.productId?.category || '')
                      const pct = freshnessPercent(item.daysLeft ?? 0, item.shelfLifeDays ?? 14)
                      const isExpanded = expandedId === item._id
                      const isSelected = selectedIds.has(item._id)
                      const scoreLabel = getScoreLabel(item.productId?.category || '', item.productId?.name || '')

                      return (
                        <div key={item._id}>
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={cn(
                              'group grid grid-cols-12 px-8 py-6 items-center transition-all',
                              isSelected ? 'bg-[#FFE66D]/40' : 'hover:bg-white/50'
                            )}
                          >
                            {/* Checkbox */}
                            <div className="col-span-1">
                              <button onClick={() => toggleSelect(item._id)}>
                                <div className={cn(
                                  'h-4 w-4 border-2 border-black flex items-center justify-center transition-colors',
                                  isSelected ? 'bg-black' : 'bg-white group-hover:bg-black/10'
                                )}>
                                  {isSelected && <div className="h-2 w-2 bg-white" />}
                                </div>
                              </button>
                            </div>

                            {/* Item details */}
                            <div className="col-span-4 flex items-center gap-4">
                              <div className={cn('w-12 h-12 flex items-center justify-center border-2 border-black shadow-[2px_2px_0_#000]', categoryIcon(canonical))}>
                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'wght' 300" }}>package_2</span>
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-lg font-noto-serif font-bold text-black leading-tight truncate">{item.productId?.name}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-black/60">{displayLabel}</span>
                                  {item.openedAt && <span className="text-[7px] font-black uppercase py-0.5 px-1.5 border border-black bg-[#FFE66D]">Opened</span>}
                                  {item.source === 'receipt_scan' && (
                                    <span className="text-[7px] font-black uppercase py-0.5 px-1.5 border border-black bg-white text-black/60">📷 Scan</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status / storage */}
                            <div className="col-span-3 flex flex-col items-center gap-1.5">
                              <div className={cn('px-3 py-1 border-2 border-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5', statusBg(item.status))}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', statusDot(item.status))} />
                                {statusLabel(item.status, item.daysLeft ?? 0, scoreLabel)}
                              </div>
                              <span className={cn('border border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]', storageBadge(item.storageMethodId?.name))}>
                                {item.storageMethodId?.name || 'Room Temp'}
                              </span>
                            </div>

                            {/* Quantity */}
                            <div className="col-span-1 text-center">
                              <p className="text-base font-bold text-black">{item.quantity}</p>
                              <p className="text-[9px] uppercase text-black/50">{item.unit}</p>
                            </div>

                            {/* Condition */}
                            <div className="col-span-2 flex justify-end">
                              <div className="w-28 space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-tight text-black/60">
                                  <button
                                    onClick={() => setExpandedId(isExpanded ? null : item._id)}
                                    className="flex items-center gap-0.5 hover:text-black transition-colors"
                                    title="Show freshness breakdown"
                                  >
                                    {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                    Condition
                                  </button>
                                  <span className="text-black font-black">{pct}%</span>
                                </div>
                                <div className="h-1.5 bg-white border border-black overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8 }}
                                    className={cn('h-full', pct > 50 ? 'bg-[#93E1A8]' : pct > 20 ? 'bg-[#FFE66D]' : 'bg-[#FFAB40]')}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditItem(item)}
                                title="Edit item"
                                className="p-1.5 border border-black bg-white hover:bg-[#FFE66D] transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${item.productId?.name}"?`)) handleDelete(item._id)
                                }}
                                disabled={deletingId === item._id}
                                title="Delete item"
                                className="p-1.5 border border-black bg-white hover:bg-[#FFD2CC] transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.div>

                          {isExpanded && <ConditionExplainer item={item} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          ))}

          {items.length > 0 && filteredItems.length === 0 && (
            <div className="border-4 border-black bg-white p-6 text-center shadow-[6px_6px_0_#000]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/60">No results</p>
              <h3 className="mt-2 font-noto-serif text-3xl text-black">
                {searchTerm ? `No pantry items match "${searchTerm}"` : 'Nothing fits this filter.'}
              </h3>
              <p className="mt-2 font-manrope text-sm text-black/70">Try a different search term or category.</p>
            </div>
          )}
        </div>

        {items.length === 0 && (
          <div className="border-4 border-black bg-white p-10 text-center shadow-[6px_6px_0_#000]">
            <div className="w-16 h-16 border-4 border-black bg-[#FFE66D] flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/60 mb-2">Empty pantry</p>
            <h3 className="font-noto-serif text-4xl text-black mb-3">Nothing tracked yet.</h3>
            <p className="font-manrope text-sm text-black/70 max-w-sm mx-auto mb-6">
              Start by adding your first grocery item.
            </p>
            <Link href="/add" className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE66D] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0_#000]">
              <Plus className="h-4 w-4" /> Add first item
            </Link>
          </div>
        )}

        {items.length > 0 && filteredItems.length === 0 && (
          <div className="border-4 border-black bg-white p-6 text-center shadow-[6px_6px_0_#000]">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/60">No results</p>
            <h3 className="mt-2 font-noto-serif text-3xl text-black">
              {searchTerm ? `No pantry items match "${searchTerm}"` : 'Nothing fits this filter.'}
            </h3>
            <p className="mt-2 font-manrope text-sm text-black/70">Try a different search term or category.</p>
          </div>
        )}

        {/* ── Bulk Action Bar ────────────────────────────────── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 border-4 border-black bg-black text-white px-6 py-4 shadow-[8px_8px_0_#93E1A8]"
            >
              <CheckCircle2 className="h-5 w-5 text-[#93E1A8] shrink-0" />
              <span className="font-black text-sm uppercase tracking-[0.15em]">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-2 border-2 border-white bg-[#FFD2CC] text-black px-4 py-2 font-black text-xs uppercase tracking-[0.15em] hover:bg-white transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {bulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size}`}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="border-2 border-white px-4 py-2 font-black text-xs uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────── */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={updated => {
            setItems(prev => prev.map(i => i._id === updated._id ? updated : i))
            router.refresh()
          }}
        />
      )}
    </DashboardLayout>
  )
}

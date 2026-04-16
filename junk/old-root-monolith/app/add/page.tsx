'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/Button'
import CustomSelect from '@/components/ui/CustomSelect'
import LoadingFruit from '@/components/ui/loading-fruit'
import ImageCapture from '@/components/ImageCapture'
import { formatIndianDate } from '@/lib/dateUtils'
import { getApiBaseUrl } from '@/lib/api'

type Product = {
  id: string
  name: string
  category: string
  baseShelfLifeDays: number
  roomTempShelfLifeDays: number | null
  fridgeShelfLifeDays: number | null
  freezerShelfLifeDays: number | null
  storageNotes: string | null
  defaultStorageMethodId: string
}

type StorageMethod = {
  id: string
  name: string
  tempRangeMinC: number
  tempRangeMaxC: number
  humidityPreferred: number
}

type ReviewDetectedItem = {
  id: string
  ocrName: string
  matchedName: string
  quantity: number
  unit: string
  suggestedStorage: 'room_temp' | 'refrigerator' | 'freezer'
  matchedProductId: string | null
}

const WHOLE_NUMBER_UNITS = new Set(['piece', 'pieces', 'package', 'packages', 'unit', 'units', 'pcs'])

const requiresWholeNumber = (unit: string) => WHOLE_NUMBER_UNITS.has(unit.toLowerCase())

const normalizeNameForMatch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const buildNameCandidates = (name: string) => {
  const raw = name.trim()
  if (!raw) return []

  const parts = raw.split('/').map((p) => p.trim()).filter(Boolean)
  const candidates = new Set<string>()
  candidates.add(raw)
  for (const part of parts) candidates.add(part)

  return Array.from(candidates)
}

const pickPrimaryProductName = (name: string) => {
  const parts = name
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)
  return (parts[0] || name).trim()
}

const normalizeQuantityForUnit = (rawQuantity: string, unit: string) => {
  const parsed = Number(rawQuantity)
  if (!Number.isFinite(parsed) || parsed <= 0) return rawQuantity
  if (requiresWholeNumber(unit)) return String(Math.max(1, Math.round(parsed)))
  return rawQuantity
}

const getCategoryIcon = (category: string) => {
  const map: Record<string, string> = {
    'Bakery': '🥖',
    'Beverages': '🥤',
    'Condiments & Sauces': '🥫',
    'Dairy': '🥛',
    'Eggs & Tofu': '🥚',
    'Fresh Fruits': '🍎',
    'Fresh Vegetables': '🥦',
    'Frozen Foods': '❄️',
    'Meat & Poultry': '🥩',
    'Pantry Staples': '🍚',
    'Seafood': '🐟',
    'Snacks': '🍿',
    'Grains & Pasta': '🍝',
    'Canned Goods': '🥫',
    'Breakfast': '🥣',
    'Herbs & Spices': '🌿'
  }
  return map[category] || '📦'
}

export default function AddItemPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [storageMethods, setStorageMethods] = useState<StorageMethod[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedStorageId, setSelectedStorageId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('pieces')
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split('T')[0])
  const [openedAt, setOpenedAt] = useState('')
  const [notes, setNotes] = useState('')

  // Prediction preview state
  const [predictedExpiry, setPredictedExpiry] = useState<Date | null>(null)

  // AI detection state
  const [reviewItems, setReviewItems] = useState<ReviewDetectedItem[]>([])
  const [showReviewItems, setShowReviewItems] = useState(false)
  const isWholeNumberQuantity = requiresWholeNumber(unit)

  const normalizePurchaseDate = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toISOString().split('T')[0]
  }

  // Handle AI analysis results
  const handleAnalysisComplete = (data: any) => {
    const receiptPurchaseDate = normalizePurchaseDate(data?.purchase_date)
    if (receiptPurchaseDate) {
      setPurchasedAt(receiptPurchaseDate)
    }

    if (data.items && data.items.length > 0) {
      const nextItems: ReviewDetectedItem[] = data.items.map((item: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        ocrName: String(item.ocrName || item.name || '').trim(),
        matchedName: String(item.matchedProductName || item.name || '').trim(),
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        unit: String(item.unit || 'pieces'),
        suggestedStorage: item.suggestedStorage === 'freezer' ? 'freezer' : item.suggestedStorage === 'refrigerator' ? 'refrigerator' : 'room_temp',
        matchedProductId: item.matchedProductId || null,
      }))

      setReviewItems(nextItems)
      setShowReviewItems(true)
    }
  }

  const resolveStorageMethodId = (storage: ReviewDetectedItem['suggestedStorage'], fallbackId: string) => {
    const desired = storage === 'room_temp' ? 'room' : storage
    const matched = storageMethods.find((method) => method.name.toLowerCase().includes(desired))
    return matched?.id || fallbackId
  }

  const findBestProductByName = (name: string) => {
    const candidates = buildNameCandidates(name)
    if (!candidates.length) return null

    let bestProduct: Product | null = null
    let bestScore = 0

    for (const candidate of candidates) {
      const query = normalizeNameForMatch(candidate)
      if (!query) continue

      for (const product of products) {
        const productName = normalizeNameForMatch(product.name)
        if (!productName) continue

        let score = 0
        if (productName === query) {
          score = 1
        } else if (productName.includes(query) || query.includes(productName)) {
          score = 0.9
        } else {
          const queryTokens = query.split(' ').filter((t) => t.length > 1)
          const productTokens = productName.split(' ').filter((t) => t.length > 1)
          if (!queryTokens.length || !productTokens.length) continue

          const overlap = queryTokens.filter((token) => productTokens.includes(token)).length
          score = overlap / Math.max(queryTokens.length, productTokens.length)
        }

        if (score > bestScore) {
          bestScore = score
          bestProduct = product
        }
      }
    }

    return bestScore >= 0.5 ? bestProduct : null
  }

  const applyReviewItemToForm = (item: ReviewDetectedItem) => {
    const directMatch = item.matchedProductId ? products.find((p) => p.id === item.matchedProductId) || null : null
    const nameMatch = findBestProductByName(item.matchedName)
    const chosenProduct = directMatch || nameMatch

    if (chosenProduct) {
      setSelectedCategory(chosenProduct.category)
      setSelectedProductId(chosenProduct.id)
      setSelectedStorageId(resolveStorageMethodId(item.suggestedStorage, chosenProduct.defaultStorageMethodId))
    }

    setUnit(item.unit || 'pieces')
    setQuantity(normalizeQuantityForUnit(String(item.quantity || 1), item.unit || 'pieces'))
  }

  const updateReviewItem = (id: string, patch: Partial<ReviewDetectedItem>) => {
    setReviewItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const removeReviewItem = (id: string) => {
    setReviewItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addAllReviewedItemsToInventory = async () => {
    if (!reviewItems.length) {
      setError('No reviewed items to add')
      return
    }
    if (!purchasedAt) {
      setError('Please select a purchase date')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const baseUrl = getApiBaseUrl()
      let addedCount = 0
      let skippedCount = 0
      const skippedItems: string[] = []
      const locallyCreatedProducts: Product[] = []

      for (const item of reviewItems) {
        const directMatch = item.matchedProductId ? products.find((p) => p.id === item.matchedProductId) || null : null
        const nameMatch = findBestProductByName(item.matchedName)
        let chosenProduct = directMatch || nameMatch

        if (!chosenProduct) {
          const primaryName = pickPrimaryProductName(item.matchedName || item.ocrName)
          const defaultStorageMethodId =
            item.suggestedStorage === 'freezer' ? 'freezer' : item.suggestedStorage === 'refrigerator' ? 'fridge' : 'room'

          const createRes = await fetch(`${baseUrl}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: primaryName,
              category: 'Pantry Staples',
              defaultStorageMethodId,
              baseShelfLifeDays: item.suggestedStorage === 'refrigerator' ? 7 : 14,
              roomTempShelfLifeDays: item.suggestedStorage === 'refrigerator' ? 2 : 7,
              fridgeShelfLifeDays: item.suggestedStorage === 'refrigerator' ? 7 : 14,
              freezerShelfLifeDays: 90,
              storageNotes: 'Auto-created from OCR review list',
            }),
          })

          if (createRes.ok) {
            const created = await createRes.json()
            chosenProduct = {
              id: String(created.id || created._id),
              name: String(created.name || primaryName),
              category: String(created.category || 'Pantry Staples'),
              baseShelfLifeDays: Number(created.baseShelfLifeDays) || 14,
              roomTempShelfLifeDays: created.roomTempShelfLifeDays ?? 7,
              fridgeShelfLifeDays: created.fridgeShelfLifeDays ?? 14,
              freezerShelfLifeDays: created.freezerShelfLifeDays ?? 90,
              storageNotes: created.storageNotes || null,
              defaultStorageMethodId: String(created.defaultStorageMethodId || defaultStorageMethodId),
            }
            locallyCreatedProducts.push(chosenProduct)
          }
        }

        if (!chosenProduct) {
          skippedCount += 1
          skippedItems.push(item.matchedName || item.ocrName || 'unknown item')
          continue
        }

        const normalizedQuantity = Number(normalizeQuantityForUnit(String(item.quantity || 1), item.unit || 'pieces'))
        const finalQuantity = Number.isFinite(normalizedQuantity) && normalizedQuantity > 0 ? normalizedQuantity : 1

        const response = await fetch(`${baseUrl}/api/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: chosenProduct.id,
            storageMethodId: resolveStorageMethodId(item.suggestedStorage, chosenProduct.defaultStorageMethodId),
            quantity: finalQuantity,
            unit: item.unit || 'pieces',
            purchasedAt,
            openedAt: openedAt || null,
            notes: notes || null,
          }),
        })

        if (!response.ok) {
          skippedCount += 1
          skippedItems.push(item.matchedName || item.ocrName || 'unknown item')
          continue
        }

        addedCount += 1
      }

      if (locallyCreatedProducts.length > 0) {
        setProducts((prev) => [...prev, ...locallyCreatedProducts])
      }

      if (addedCount === 0) {
        setError('No items were added. Please verify matched item names in review list.')
        setSubmitting(false)
        return
      }

      if (skippedCount > 0) {
        setError(
          `${addedCount} item(s) added. ${skippedCount} skipped: ${skippedItems
            .slice(0, 6)
            .join(', ')}${skippedItems.length > 6 ? '...' : ''}`
        )
        setSubmitting(false)
        return
      }

      router.push('/inventory')
    } catch (err: any) {
      setError(err?.message || 'Failed to add reviewed items')
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedProductId && selectedStorageId && purchasedAt) {
      calculatePrediction()
    }
  }, [selectedProductId, selectedStorageId, purchasedAt, openedAt])

  const fetchData = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const [productsRes, storageRes] = await Promise.all([
        fetch(`${baseUrl}/api/products`),
        fetch(`${baseUrl}/api/storage-methods`)
      ])

      if (!productsRes.ok || !storageRes.ok) {
        const [productsErr, storageErr] = await Promise.all([
          productsRes.ok ? Promise.resolve(null) : productsRes.json().catch(() => null),
          storageRes.ok ? Promise.resolve(null) : storageRes.json().catch(() => null)
        ])

        const productMsg = productsErr?.error ? `Products: ${productsErr.error}` : ''
        const storageMsg = storageErr?.error ? `Storage methods: ${storageErr.error}` : ''
        const reason = [productMsg, storageMsg].filter(Boolean).join(' | ')

        throw new Error(reason || `Failed to fetch data (${productsRes.status}/${storageRes.status})`)
      }

      const productsData = await productsRes.json()
      const storageData = await storageRes.json()

      setProducts(productsData)
      setStorageMethods(storageData)

      // Extract unique categories
      const categorySet = new Set<string>(productsData.map((p: Product) => p.category))
      const uniqueCategories = Array.from(categorySet).sort()
      setCategories(uniqueCategories)

      setLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
      setLoading(false)
    }
  }

  const calculatePrediction = () => {
    const product = products.find(p => p.id === selectedProductId)
    const storage = storageMethods.find(s => s.id === selectedStorageId)

    if (!product || !storage) return

    // Determine shelf life based on storage method
    let shelfLifeDays = product.baseShelfLifeDays
    const methodLower = storage.name.toLowerCase()

    if (methodLower.includes('room') && product.roomTempShelfLifeDays !== null) {
      shelfLifeDays = product.roomTempShelfLifeDays
    } else if ((methodLower.includes('fridge') || methodLower.includes('refrig')) && product.fridgeShelfLifeDays !== null) {
      shelfLifeDays = product.fridgeShelfLifeDays
    } else if (methodLower.includes('freezer') && product.freezerShelfLifeDays !== null) {
      shelfLifeDays = product.freezerShelfLifeDays
    }

    // Apply penalty if opened
    let effectiveDays = shelfLifeDays
    if (openedAt) {
      effectiveDays = Math.round(shelfLifeDays * 0.75) // 25% reduction if opened
    }

    const purchased = new Date(purchasedAt)
    const expiry = new Date(purchased)
    expiry.setDate(expiry.getDate() + effectiveDays)
    setPredictedExpiry(expiry)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedProductId) {
      setError('Please select a product')
      return
    }
    if (!selectedStorageId) {
      setError('Please select a storage method')
      return
    }
    const parsedQuantity = Number(quantity)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }
    if (requiresWholeNumber(unit) && !Number.isInteger(parsedQuantity)) {
      setError('Please enter a whole number for pieces/packages')
      return
    }
    if (!purchasedAt) {
      setError('Please select a purchase date')
      return
    }

    setSubmitting(true)

    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          storageMethodId: selectedStorageId,
          quantity: parsedQuantity,
          unit,
          purchasedAt,
          openedAt: openedAt || null,
          notes: notes || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add item')
      }

      router.push('/inventory')
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products

  const selectedProduct = products.find(p => p.id === selectedProductId)

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <LoadingFruit />
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F6F1E7] px-2 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
      <div className="mb-6 sm:mb-8 border-4 border-black bg-white p-4 sm:p-6 shadow-[8px_8px_0_#000]">
        <Button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
              return
            }
            router.push('/inventory')
          }}
          className="mb-4 border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-black hover:text-white"
        >
          Back
        </Button>
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-black/60">Inventory Intake</p>
        <h1 className="mt-2 font-noto-serif text-4xl sm:text-5xl leading-[0.95] text-black">Add New Item</h1>
        <p className="mt-3 font-manrope text-sm text-black/75">Add groceries to your inventory with smart expiry predictions.</p>
      </div>

      {error && (
        <div className="mb-6 border-2 border-black bg-[#FFD9D9] p-4 font-ibm-mono text-xs uppercase tracking-[0.14em] text-black shadow-[4px_4px_0_#000]">
          {error}
        </div>
      )}

      {/* AI Smart Scan Section */}
      <div className="mb-8">
        <ImageCapture onAnalysisComplete={handleAnalysisComplete} />
      </div>

      {/* Review Items from AI */}
      {showReviewItems && reviewItems.length > 0 && (
        <div className="mb-8 border-4 border-black bg-[#DDE8FF] p-4 shadow-[8px_8px_0_#000]">
          <div className="mb-4">
            <h3 className="font-ibm-mono text-xs font-black uppercase tracking-[0.26em] text-black flex items-center gap-2">
              <span>✨</span> Review Item List
            </h3>
          </div>
          <div className="space-y-3">
            {reviewItems.map((item) => (
              <div key={item.id} className="border-2 border-black bg-white p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.45fr_0.45fr_auto]">
                  <input
                    value={item.ocrName}
                    readOnly
                    className="border-2 border-black bg-[#EFEFEF] px-3 py-2 font-mono text-sm"
                    placeholder="OCR name"
                    title="Detected from receipt OCR"
                  />
                  <input
                    value={item.matchedName}
                    onChange={(e) => updateReviewItem(item.id, { matchedName: e.target.value })}
                    className="border-2 border-black bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Matched item"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateReviewItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="border-2 border-black bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Qty"
                  />
                  <input
                    value={item.unit}
                    onChange={(e) => updateReviewItem(item.id, { unit: e.target.value || 'pieces' })}
                    className="border-2 border-black bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Unit"
                  />
                  <button
                    type="button"
                    onClick={() => removeReviewItem(item.id)}
                    className="border-2 border-black bg-[#FFD7D7] px-3 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em]"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateReviewItem(item.id, { suggestedStorage: 'room_temp' })}
                    className={`border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.14em] ${
                      item.suggestedStorage === 'room_temp' ? 'bg-[#93E1A8] text-black' : 'bg-white text-black'
                    }`}
                  >
                    Room Temp
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReviewItem(item.id, { suggestedStorage: 'refrigerator' })}
                    className={`border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.14em] ${
                      item.suggestedStorage === 'refrigerator' ? 'bg-[#93E1A8] text-black' : 'bg-white text-black'
                    }`}
                  >
                    Fridge
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReviewItem(item.id, { suggestedStorage: 'freezer' })}
                    className={`border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.14em] ${
                      item.suggestedStorage === 'freezer' ? 'bg-[#93E1A8] text-black' : 'bg-white text-black'
                    }`}
                  >
                    Freezer
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={addAllReviewedItemsToInventory}
                disabled={submitting || reviewItems.length === 0}
                className="border-2 border-black bg-[#93E1A8] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add All To Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="border-4 border-black bg-white p-4 sm:p-6 shadow-[8px_8px_0_#000]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                  Category
                </label>
                <CustomSelect
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val)
                    setSelectedProductId('')
                  }}
                  options={categories.map(cat => ({
                    label: cat,
                    value: cat,
                    icon: getCategoryIcon(cat)
                  }))}
                  placeholder="Select a category"
                />
              </div>

              <div>
                <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                  Product
                </label>
                <CustomSelect
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  disabled={!selectedCategory}
                  options={filteredProducts.map(product => ({
                    label: product.name,
                    value: product.id
                  }))}
                  placeholder="Select a product"
                />
              </div>

              {selectedProduct?.storageNotes && (
                <div className="border-2 border-black bg-[#DDE8FF] p-3">
                  <p className="font-manrope text-sm text-black">
                    💡 <span className="font-black uppercase tracking-[0.08em]">Storage Tip:</span> {selectedProduct.storageNotes}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                  Storage Method
                </label>
                <CustomSelect
                  value={selectedStorageId}
                  onChange={(val) => setSelectedStorageId(val)}
                  options={storageMethods.map(method => ({
                    label: method.name,
                    value: method.id,
                    icon: method.name.toLowerCase().includes('fridge') ? '❄️' : 
                          method.name.toLowerCase().includes('freezer') ? '🧊' : '🏠'
                  }))}
                  placeholder="Select storage method"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step={isWholeNumberQuantity ? '1' : '0.01'}
                    min={isWholeNumberQuantity ? '1' : '0.01'}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                    Unit
                  </label>
                  <CustomSelect
                    value={unit}
                    onChange={(val) => {
                      setUnit(val)
                      setQuantity((prev) => normalizeQuantityForUnit(prev, val))
                    }}
                    options={[
                      { label: 'Pieces', value: 'pieces' },
                      { label: 'Kg', value: 'kg' },
                      { label: 'Grams', value: 'g' },
                      { label: 'Liters', value: 'L' },
                      { label: 'mL', value: 'mL' },
                      { label: 'Pounds', value: 'lbs' },
                      { label: 'Ounces', value: 'oz' },
                      { label: 'Packages', value: 'packages' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                    Opened Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={openedAt}
                    onChange={(e) => setOpenedAt(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-ibm-mono text-[10px] font-black uppercase tracking-[0.22em] text-black/70">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full border-2 border-black bg-white px-3 py-2 font-manrope text-black focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button type="submit" disabled={submitting} className="min-h-11 border-2 border-black bg-[#93E1A8] px-6 py-3 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white">
                  {submitting ? 'Adding...' : 'Add to Inventory'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/inventory')}
                  className="min-h-11 border-2 border-black bg-white px-6 py-3 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="border-4 border-black bg-white p-4 sm:p-6 shadow-[8px_8px_0_#000]">
            <h3 className="mb-4 font-noto-serif text-3xl text-black">Prediction Preview</h3>
            
            {predictedExpiry ? (
              <div className="space-y-6">
                <div className="border-2 border-black bg-[#DDF5E3] p-4 text-center">
                  <p className="mb-1 font-ibm-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/70">Predicted Expiry</p>
                  <p className="font-noto-serif text-4xl font-bold text-black">
                    {formatIndianDate(predictedExpiry)}
                  </p>
                  <p className="mt-1 font-manrope text-sm font-bold text-black/80">
                    {(() => {
                      const diffTime = predictedExpiry.getTime() - new Date().getTime();
                      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (daysLeft <= 0) {
                        return "Expires Today (Consume within 2-4 hours)";
                      }
                      return `${daysLeft} days left`;
                    })()}
                  </p>
                </div>

                {/* Storage Comparison Chart */}
                {selectedProduct && (
                  <div className="h-48 w-full">
                    <p className="mb-2 font-ibm-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/70">Storage Method Comparison</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Pantry', days: selectedProduct.roomTempShelfLifeDays || 0, color: '#f97316' },
                          { name: 'Fridge', days: selectedProduct.fridgeShelfLifeDays || 0, color: '#3b82f6' },
                          { name: 'Freezer', days: selectedProduct.freezerShelfLifeDays || 0, color: '#6366f1' },
                        ].filter(d => d.days > 0)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: 'currentColor' }} 
                          width={50}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                          }}
                        />
                        <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
                          {
                            [
                              { name: 'Pantry', days: selectedProduct.roomTempShelfLifeDays || 0, color: '#f97316' },
                              { name: 'Fridge', days: selectedProduct.fridgeShelfLifeDays || 0, color: '#3b82f6' },
                              { name: 'Freezer', days: selectedProduct.freezerShelfLifeDays || 0, color: '#6366f1' },
                            ].filter(d => d.days > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                  <div className="text-center">
                    <p className="mb-1 font-ibm-mono text-[10px] font-black uppercase tracking-[0.18em] text-black/70">Model Confidence</p>
                    <div className="relative h-2 overflow-hidden border border-black bg-white">
                      <div className="absolute top-0 left-0 h-full bg-green-500 w-[85%]"></div>
                    </div>
                    <p className="mt-1 font-manrope text-sm font-bold text-black">85%</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 font-ibm-mono text-[10px] font-black uppercase tracking-[0.18em] text-black/70">Model Version</p>
                    <p className="mt-2 font-manrope text-sm font-bold text-black">rb-1.1</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-black/40 p-6 text-center">
                <span className="text-4xl mb-3">🔮</span>
                <p className="font-manrope text-sm text-black/70">
                  Select a product and storage method to see the AI prediction and storage comparison.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  )
}

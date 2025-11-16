'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SectionHeading from '@/components/ui/SectionHeading'
import { formatIndianDate } from '@/lib/dateUtils'

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
      const [productsRes, storageRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/storage-methods')
      ])

      if (!productsRes.ok || !storageRes.ok) {
        throw new Error('Failed to fetch data')
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
      setError('Failed to load data')
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

    if (methodLower.includes('room') && product.roomTempShelfLifeDays) {
      shelfLifeDays = product.roomTempShelfLifeDays
    } else if (methodLower.includes('fridge') && product.fridgeShelfLifeDays) {
      shelfLifeDays = product.fridgeShelfLifeDays
    } else if (methodLower.includes('freezer') && product.freezerShelfLifeDays) {
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
    setSubmitting(true)

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          storageMethodId: selectedStorageId,
          quantity: parseFloat(quantity),
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
      <main className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SectionHeading>Add New Item</SectionHeading>
        <p className="text-gray-600 mt-2">Add groceries to your inventory with smart expiry predictions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setSelectedProductId('')
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  disabled={!selectedCategory}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">Select a product</option>
                  {filteredProducts.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              {selectedProduct?.storageNotes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <span className="font-medium">Storage Tip:</span> {selectedProduct.storageNotes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Method
                </label>
                <select
                  value={selectedStorageId}
                  onChange={(e) => setSelectedStorageId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select storage method</option>
                  {storageMethods.map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kg</option>
                    <option value="g">Grams</option>
                    <option value="L">Liters</option>
                    <option value="mL">mL</option>
                    <option value="lbs">Pounds</option>
                    <option value="oz">Ounces</option>
                    <option value="packages">Packages</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opened Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={openedAt}
                    onChange={(e) => setOpenedAt(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add to Inventory'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/inventory')}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="font-semibold text-lg mb-4">Prediction Preview</h3>
            
            {predictedExpiry ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Predicted Expiry</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatIndianDate(predictedExpiry)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Days until expiry:</span>
                    <span className="font-medium">
                      {Math.ceil((predictedExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">rb-1.1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">85%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    This prediction is based on storage conditions and product characteristics.
                    Actual shelf life may vary based on environmental factors.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Select a product and storage method to see the predicted expiry date.
              </p>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}

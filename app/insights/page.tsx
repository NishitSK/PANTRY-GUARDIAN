import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import dynamic from 'next/dynamic'

const InsightsLocationWeather = dynamic(() => import('@/components/InsightsLocationWeather'), { ssr: false })

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect('/auth/login')
  }

  const items = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: {
      product: true,
      storageMethod: true,
      predictions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  // Calculate statistics
  const totalItems = items.length
  
  // Count by category
  const categoryCount = items.reduce((acc, item) => {
    const cat = item.product.category
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Count items by urgency
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  let expiredCount = 0
  let expiringCount = 0
  let freshCount = 0

  items.forEach(item => {
    const prediction = item.predictions[0]
    if (!prediction) {
      freshCount++
      return
    }

    const expiryDate = new Date(prediction.predictedExpiry)
    if (expiryDate < now) {
      expiredCount++
    } else if (expiryDate <= threeDaysFromNow) {
      expiringCount++
    } else {
      freshCount++
    }
  })

  // Calculate average confidence
  const predictionsWithConfidence = items
    .map(item => item.predictions[0]?.confidence)
    .filter((c): c is number => c !== undefined)
  
  const avgConfidence = predictionsWithConfidence.length > 0
    ? (predictionsWithConfidence.reduce((a, b) => a + b, 0) / predictionsWithConfidence.length * 100).toFixed(1)
    : '0'

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div>
          <SectionHeading>Insights & Analytics</SectionHeading>
          <p className="text-gray-600 mt-2">Track your pantry statistics, trends and weather context.</p>
        </div>
        <InsightsLocationWeather />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Total Items</p>
            <p className="text-4xl font-bold text-green-600">{totalItems}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Expired</p>
            <p className="text-4xl font-bold text-red-600">{expiredCount}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Expiring Soon</p>
            <p className="text-4xl font-bold text-orange-500">{expiringCount}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Fresh</p>
            <p className="text-4xl font-bold text-green-600">{freshCount}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <h3 className="font-semibold text-lg mb-4">Top Categories</h3>
          {sortedCategories.length === 0 ? (
            <p className="text-gray-500 text-sm">No items in inventory</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([category, count]) => {
                const percentage = ((count / totalItems) * 100).toFixed(0)
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="text-gray-600">{count} items ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">Prediction Quality</h3>
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                Average Confidence
              </p>
              <p className="text-5xl font-bold text-green-600">{avgConfidence}%</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                  Model Version
                </p>
                <p className="text-lg font-semibold text-gray-800">rb-1.1</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                  Predictions Made
                </p>
                <p className="text-lg font-semibold text-gray-800">{predictionsWithConfidence.length}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Our storage-aware prediction model (rb-1.1) uses room temperature, refrigerator, 
              and freezer-specific shelf life data to provide accurate expiry predictions.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-lg mb-4">Storage Distribution</h3>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No items in inventory</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                Room Temperature
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {items.filter(i => i.storageMethod?.name?.toLowerCase().includes('room')).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">items</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                Refrigerator
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {items.filter(i => i.storageMethod?.name?.toLowerCase().includes('fridge')).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">items</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                Freezer
              </p>
              <p className="text-3xl font-bold text-indigo-600">
                {items.filter(i => i.storageMethod?.name?.toLowerCase().includes('freezer')).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">items</p>
            </div>
          </div>
        )}
      </Card>
    </main>
  )
}

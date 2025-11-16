import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import UrgencyBadge from '@/components/UrgencyBadge'
import { formatIndianDate } from '@/lib/dateUtils'
import LocationPromptWrapper from '@/components/LocationPromptWrapper'

export default async function Home() {
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

  // Get all items with their predictions
  const allItems = await prisma.inventoryItem.findMany({
    where: {
      userId: user.id
    },
    include: {
      product: true,
      storageMethod: true,
      predictions: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  })

  // Filter items expiring within 3 days
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const atRiskItems = allItems
    .filter(item => {
      const latestPrediction = item.predictions[0]
      if (!latestPrediction) return false
      return new Date(latestPrediction.predictedExpiry) <= threeDaysFromNow
    })
    .sort((a, b) => {
      const aExpiry = a.predictions[0]?.predictedExpiry || new Date()
      const bExpiry = b.predictions[0]?.predictedExpiry || new Date()
      return new Date(aExpiry).getTime() - new Date(bExpiry).getTime()
    })

  const totalItems = allItems.length

  return (
    <>
      <LocationPromptWrapper />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            You have {totalItems} items in your pantry
          </p>
        </div>

      <div className="mb-8">
        <SectionHeading className="mb-4">
          Items Requiring Attention
        </SectionHeading>
        
        {atRiskItems.length === 0 ? (
          <Card>
            <p className="text-gray-600">
              🎉 Great! No items expiring in the next 3 days.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {atRiskItems.map((item) => {
              const latestPrediction = item.predictions[0]
              if (!latestPrediction) return null

              const daysUntilExpiry = Math.ceil(
                (new Date(latestPrediction.predictedExpiry).getTime() - new Date().getTime()) / 
                (1000 * 60 * 60 * 24)
              )
              
              const urgencyLevel = 
                daysUntilExpiry < 0 || daysUntilExpiry === 0 ? 'red' :
                daysUntilExpiry <= 2 ? 'orange' :
                'green'
              
              return (
                <Card key={item.id}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {item.product.name}
                    </h3>
                    <UrgencyBadge level={urgencyLevel} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{item.storageMethod.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">
                        {formatIndianDate(new Date(latestPrediction.predictedExpiry))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days left:</span>
                      <span className={`font-medium ${
                        daysUntilExpiry < 0 ? 'text-red-600' : 
                        daysUntilExpiry === 0 ? 'text-orange-600' : 
                        'text-yellow-600'
                      }`}>
                        {daysUntilExpiry < 0 ? 'Expired' : 
                         daysUntilExpiry === 0 ? 'Today' : 
                         `${daysUntilExpiry} days`}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
    </>
  )
}
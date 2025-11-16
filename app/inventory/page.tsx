import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import UrgencyBadge from '@/components/UrgencyBadge'
import { formatIndianDate } from '@/lib/dateUtils'

export default async function InventoryPage() {
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
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SectionHeading>My Inventory</SectionHeading>
        <p className="text-gray-600 mt-2">
          You have {items.length} {items.length === 1 ? 'item' : 'items'} in your pantry
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Your inventory is empty</p>
            <a href="/add" className="text-green-600 hover:text-green-700 font-medium">
              Add your first item →
            </a>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const latestPrediction = item.predictions[0]
            const daysUntilExpiry = latestPrediction
              ? Math.ceil(
                  (new Date(latestPrediction.predictedExpiry).getTime() - new Date().getTime()) / 
                  (1000 * 60 * 60 * 24)
                )
              : null

            const urgencyLevel = 
              daysUntilExpiry === null ? 'green' :
              daysUntilExpiry < 0 || daysUntilExpiry === 0 ? 'red' :
              daysUntilExpiry <= 2 ? 'orange' :
              'green'

            return (
              <Card key={item.id}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-800">
                        {item.product.name}
                      </h3>
                      {latestPrediction && <UrgencyBadge level={urgencyLevel} />}
                    </div>
                    <p className="text-sm text-gray-600">{item.product.category}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                    <p className="font-medium">{item.quantity} {item.unit}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Storage</p>
                    <p className="font-medium">{item.storageMethod.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expires</p>
                    {latestPrediction ? (
                      <>
                        <p className="font-medium">
                          {formatIndianDate(new Date(latestPrediction.predictedExpiry))}
                        </p>
                        <p className={`text-xs mt-1 ${
                          daysUntilExpiry! < 0 ? 'text-red-600' : 
                          daysUntilExpiry === 0 ? 'text-orange-600' : 
                          'text-gray-600'
                        }`}>
                          {daysUntilExpiry! < 0 ? 'Expired' : 
                           daysUntilExpiry === 0 ? 'Expires today' : 
                           `${daysUntilExpiry} days left`}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">-</p>
                    )}
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {item.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <form action={`/api/inventory/${item.id}`} method="DELETE">
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}

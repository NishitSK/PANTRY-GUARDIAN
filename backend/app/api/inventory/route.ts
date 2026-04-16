import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User, InventoryItem, Product, StorageMethod, WeatherSnapshot, Prediction } from '@/models'
import { predict } from '@/lib/prediction'
import { getCurrentWeather } from '@/lib/weather'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

const WHOLE_NUMBER_UNITS = new Set(['piece', 'pieces', 'package', 'packages', 'unit', 'units', 'pcs'])

const requiresWholeNumber = (unit: string) => WHOLE_NUMBER_UNITS.has(unit.toLowerCase())

async function getOrCreateDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  let user = await User.findOne({ email })
  if (!user) {
    user = await User.create({
      email,
      name: clerkUser?.fullName || clerkUser?.firstName || undefined,
      image: clerkUser?.imageUrl,
    })
  }

  return user
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const user = await getOrCreateDbUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await InventoryItem.find({ userId: user._id.toString() })
      .populate('productId')
      .populate('storageMethodId')
      .sort({ createdAt: -1 })
      .lean()

    // Get the latest prediction for each item
    const itemsWithPredictions = await Promise.all(
      items.map(async (item) => {
        const predictions = await Prediction.find({ inventoryItemId: item._id.toString() })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean()

        return {
          ...item,
          _id: item._id.toString(),
          userId: item.userId.toString(),
          // productId and storageMethodId are now populated objects, so return them as is
          productId: item.productId as any,
          storageMethodId: item.storageMethodId as any,
          predictions: predictions.map(p => ({
            ...p,
            _id: p._id.toString(),
            inventoryItemId: p.inventoryItemId.toString()
          }))
        }
      })
    )

    return NextResponse.json(itemsWithPredictions)
  } catch (error) {
    console.error('Get inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const user = await getOrCreateDbUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, storageMethodId, quantity, unit, purchasedAt, openedAt, notes } = await req.json()

    const missingFields = []
    if (!productId) missingFields.push('Product')
    if (!storageMethodId) missingFields.push('Storage Method')
    if (!quantity) missingFields.push('Quantity')
    if (!unit) missingFields.push('Unit')
    if (!purchasedAt) missingFields.push('Purchase Date')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const parsedQuantity = Number(quantity)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    if (requiresWholeNumber(String(unit)) && !Number.isInteger(parsedQuantity)) {
      return NextResponse.json(
        { error: 'Quantity must be a whole number for piece-based units' },
        { status: 400 }
      )
    }

    // Get product and storage method info
    const product = await Product.findById(productId).lean()
    const storageMethod = await StorageMethod.findById(storageMethodId).lean()

    if (!product || !storageMethod) {
      return NextResponse.json(
        { error: 'Product or storage method not found' },
        { status: 404 }
      )
    }

    // Get weather data
    const weather = await getCurrentWeather(user.city)

    // Create inventory item
    const item = await InventoryItem.create({
      userId: user._id.toString(),
      productId,
      storageMethodId,
      quantity: parsedQuantity,
      unit,
      purchasedAt: new Date(purchasedAt),
      openedAt: openedAt ? new Date(openedAt) : null,
      notes: notes || null
    })

    // Create weather snapshot if weather data available
    if (weather) {
      await WeatherSnapshot.create({
        inventoryItemId: item._id.toString(),
        tempC: weather.tempC,
        humidity: weather.humidity
      })
    }

    // Create prediction
    const prediction = predict({
      baseShelfLifeDays: product.baseShelfLifeDays,
      roomTempShelfLifeDays: product.roomTempShelfLifeDays,
      fridgeShelfLifeDays: product.fridgeShelfLifeDays,
      freezerShelfLifeDays: product.freezerShelfLifeDays,
      storageMethodName: storageMethod.name,
      tempMinC: storageMethod.tempRangeMinC,
      tempMaxC: storageMethod.tempRangeMaxC,
      humidityPreferred: storageMethod.humidityPreferred,
      tempC: weather?.tempC || 20,
      humidity: weather?.humidity || 60,
      purchasedAt: new Date(purchasedAt),
      openedAt: openedAt ? new Date(openedAt) : null
    })

    await Prediction.create({
      inventoryItemId: item._id.toString(),
      predictedExpiry: prediction.predictedExpiry,
      confidence: prediction.confidence,
      modelVersion: prediction.modelVersion
    })

    // Return the complete item
    const completeItem = await InventoryItem.findById(item._id)
      .populate('productId')
      .populate('storageMethodId')
      .lean()

    const latestPredictions = await Prediction.find({ inventoryItemId: item._id.toString() })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean()

    return NextResponse.json({
      ...completeItem,
      _id: completeItem!._id.toString(),
      userId: completeItem!.userId.toString(),
      // productId and storageMethodId are now populated objects
      productId: completeItem!.productId as any,
      storageMethodId: completeItem!.storageMethodId as any,
      predictions: latestPredictions.map(p => ({
        ...p,
        _id: p._id.toString(),
        inventoryItemId: p.inventoryItemId.toString()
      }))
    }, { status: 201 })
  } catch (error) {
    console.error('Create inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

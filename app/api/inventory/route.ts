import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { predict } from '@/lib/prediction'
import { getCurrentWeather } from '@/lib/weather'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    return NextResponse.json(items)
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { productId, storageMethodId, quantity, unit, purchasedAt, openedAt, notes } = await req.json()

    if (!productId || !storageMethodId || !quantity || !unit || !purchasedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get product and storage method info
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    const storageMethod = await prisma.storageMethod.findUnique({
      where: { id: storageMethodId }
    })

    if (!product || !storageMethod) {
      return NextResponse.json(
        { error: 'Product or storage method not found' },
        { status: 404 }
      )
    }

    // Get weather data
    const weather = await getCurrentWeather(user.city)

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        userId: user.id,
        productId,
        storageMethodId,
        quantity: parseFloat(quantity),
        unit,
        purchasedAt: new Date(purchasedAt),
        openedAt: openedAt ? new Date(openedAt) : null,
        notes: notes || null
      }
    })

    // Create weather snapshot if weather data available
    if (weather) {
      await prisma.weatherSnapshot.create({
        data: {
          inventoryItemId: item.id,
          tempC: weather.tempC,
          humidity: weather.humidity
        }
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

    await prisma.prediction.create({
      data: {
        inventoryItemId: item.id,
        predictedExpiry: prediction.predictedExpiry,
        confidence: prediction.confidence,
        modelVersion: prediction.modelVersion
      }
    })

    // Return the complete item
    const completeItem = await prisma.inventoryItem.findUnique({
      where: { id: item.id },
      include: {
        product: true,
        storageMethod: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json(completeItem, { status: 201 })
  } catch (error) {
    console.error('Create inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

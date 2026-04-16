import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User, InventoryItem } from '@/models'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    const userProfile = await User.findById(user._id).select('_id name email city createdAt').lean()

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate Stats
    const items = await InventoryItem.find({ userId: user._id })
      .populate('productId')
      .lean()

    const totalItems = items.length

    // Calculate estimated value (Shared Logic)
    const CATEGORY_PRICES: Record<string, number> = {
      'Meat & Poultry': 550,
      'Seafood': 600,
      'Dairy': 150,
      'Cheese': 300,
      'Bakery': 80,
      'Beverages': 120,
      'Fresh Fruits': 100,
      'Fresh Vegetables': 60,
      'Snacks': 50,
      'Frozen Foods': 250,
      'Pantry Staples': 100,
      'Grains & Pasta': 90,
      'Condiments & Sauces': 180,
      'Canned Goods': 120,
      'Breakfast': 200,
      'Herbs & Spices': 200,
      'Eggs & Tofu': 100
    }

    let totalValue = 0
    for (const item of items) {
      const product = item.productId as any
      if (!product) continue

      let price = CATEGORY_PRICES[product.category] || 150
      totalValue += price * (item.quantity || 1)
    }

    return NextResponse.json({
      id: userProfile._id.toString(),
      name: userProfile.name,
      email: userProfile.email,
      city: userProfile.city,
      createdAt: userProfile.createdAt,
      stats: {
        totalItems,
        totalValue
      }
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB()

    const user = await getOrCreateDbUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { city } = await req.json()

    if (!city || typeof city !== 'string') {
      return NextResponse.json(
        { error: 'Invalid city name' },
        { status: 400 }
      )
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { city },
      { new: true }
    ).select('_id name email city').lean()

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      city: updatedUser.city
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

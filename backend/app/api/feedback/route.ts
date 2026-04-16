import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User, Feedback, InventoryItem } from '@/models'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all inventory items for the user
    const userItems = await InventoryItem.find({ userId: user._id.toString() }).select('_id').lean()
    const itemIds = userItems.map(item => item._id.toString())

    // Get all feedback for user's inventory items
    const feedback = await Feedback.find({ inventoryItemId: { $in: itemIds } })
      .sort({ createdAt: -1 })
      .lean()

    // Populate inventory items manually
    const feedbackWithItems = await Promise.all(
      feedback.map(async (fb) => {
        const item = await InventoryItem.findById(fb.inventoryItemId)
          .populate('product')
          .lean()

        return {
          ...fb,
          _id: fb._id.toString(),
          inventoryItemId: fb.inventoryItemId.toString(),
          inventoryItem: item ? {
            ...item,
            _id: item._id.toString(),
            userId: item.userId.toString(),
            productId: item.productId.toString(),
            storageMethodId: item.storageMethodId.toString()
          } : null
        }
      })
    )

    return NextResponse.json(feedbackWithItems)
  } catch (error) {
    console.error('Get feedback error:', error)
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

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { inventoryItemId, userReportedExpiry, freshnessScore, notes } = await req.json()

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: 'Inventory item ID is required' },
        { status: 400 }
      )
    }

    // Verify the inventory item belongs to the user
    const item = await InventoryItem.findOne({
      _id: inventoryItemId,
      userId: user._id.toString()
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found or unauthorized' },
        { status: 404 }
      )
    }

    // Validate freshnessScore if provided
    if (freshnessScore !== undefined && freshnessScore !== null) {
      if (freshnessScore < 1 || freshnessScore > 5) {
        return NextResponse.json(
          { error: 'Freshness score must be between 1 and 5' },
          { status: 400 }
        )
      }
    }

    // Create feedback
    const feedback = await Feedback.create({
      inventoryItemId,
      userReportedExpiry: userReportedExpiry ? new Date(userReportedExpiry) : undefined,
      freshnessScore: freshnessScore ? parseInt(freshnessScore) : undefined,
      notes: notes || undefined
    })

    // Populate inventory item
    const populatedItem = await InventoryItem.findById(inventoryItemId).populate('product').lean()

    return NextResponse.json({
      ...feedback.toObject(),
      _id: feedback._id.toString(),
      inventoryItemId: feedback.inventoryItemId.toString(),
      inventoryItem: populatedItem ? {
        ...populatedItem,
        _id: populatedItem._id.toString(),
        userId: populatedItem.userId.toString(),
        productId: populatedItem.productId.toString(),
        storageMethodId: populatedItem.storageMethodId.toString()
      } : null
    }, { status: 201 })
  } catch (error) {
    console.error('Create feedback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

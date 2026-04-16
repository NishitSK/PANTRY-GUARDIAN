import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User, InventoryItem, Prediction, WeatherSnapshot, Feedback } from '@/models'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getOrCreateDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  await connectDB()
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const body = await req.json()
    const { quantity, unit, openedAt, notes, storageMethodId } = body

    const existingItem = await InventoryItem.findById(id)
    if (!existingItem || existingItem.userId !== user._id.toString()) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity)
    if (unit !== undefined) updateData.unit = unit
    if (notes !== undefined) updateData.notes = notes || null
    if (storageMethodId !== undefined) updateData.storageMethodId = storageMethodId
    // openedAt: pass null to clear, a date string to set
    if (openedAt !== undefined) updateData.openedAt = openedAt ? new Date(openedAt) : null

    const updatedItem = await InventoryItem.findByIdAndUpdate(id, updateData, { new: true })
      .populate('productId')
      .populate('storageMethodId')
      .lean()

    if (!updatedItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    const predictions = await Prediction.find({ inventoryItemId: id })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean()

    return NextResponse.json({
      ...updatedItem,
      _id: updatedItem._id.toString(),
      userId: updatedItem.userId.toString(),
      productId: updatedItem.productId as any,
      storageMethodId: updatedItem.storageMethodId as any,
      predictions: predictions.map(p => ({
        ...p,
        _id: p._id.toString(),
        inventoryItemId: p.inventoryItemId.toString(),
      })),
    })
  } catch (error) {
    console.error('Update inventory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params

    const existingItem = await InventoryItem.findById(id)
    if (!existingItem || existingItem.userId !== user._id.toString()) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await WeatherSnapshot.deleteMany({ inventoryItemId: id })
    await Prediction.deleteMany({ inventoryItemId: id })
    await Feedback.deleteMany({ inventoryItemId: id })
    await InventoryItem.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete inventory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

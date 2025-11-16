import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const { quantity, notes } = await req.json()

    // Verify the item belongs to the user
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id }
    })

    if (!existingItem || existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        notes: notes !== undefined ? notes || null : undefined
      },
      include: {
        product: true,
        storageMethod: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Update inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verify the item belongs to the user
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id }
    })

    if (!existingItem || existingItem.userId !== user.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete related records first (Prisma will handle cascading if configured)
    await prisma.inventoryItem.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get all feedback for user's inventory items
    const feedback = await prisma.feedback.findMany({
      where: {
        inventoryItem: {
          userId: user.id
        }
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
            predictions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(feedback)
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

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
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        userId: user.id
      }
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
    const feedback = await prisma.feedback.create({
      data: {
        inventoryItemId,
        userReportedExpiry: userReportedExpiry ? new Date(userReportedExpiry) : null,
        freshnessScore: freshnessScore ? parseInt(freshnessScore) : null,
        notes: notes || null
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
            predictions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('Create feedback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

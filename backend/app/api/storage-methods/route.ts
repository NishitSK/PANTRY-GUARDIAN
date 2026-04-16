import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { StorageMethod, User } from '@/models'

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

    const storageMethods = await StorageMethod.find().sort({ name: 1 }).lean()

    // Convert _id to string and map to id field for frontend
    const methodsWithIds = storageMethods.map(m => ({
      ...m,
      id: m._id.toString(),
      _id: m._id.toString()
    }))

    return NextResponse.json(methodsWithIds)
  } catch (error) {
    console.error('Get storage methods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

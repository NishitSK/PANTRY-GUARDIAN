import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { Product, User } from '@/models'
import { lookupShelfLife, lookupCategoryDefaults } from '@/lib/shelfLifeDb'

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

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const filter = category ? { category } : {}
    const products = await Product.find(filter).sort({ name: 1 }).lean()

    // Convert _id to string and map to id field for frontend
    const productsWithIds = products.map(p => ({
      ...p,
      id: p._id.toString(),
      _id: p._id.toString(),
      defaultStorageMethodId: p.defaultStorageMethodId.toString()
    }))

    return NextResponse.json(productsWithIds)
  } catch (error) {
    console.error('Get products error:', error)
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

    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    const category = String(body?.category || 'Pantry Staples').trim() || 'Pantry Staples'
    const defaultStorageMethodId = String(body?.defaultStorageMethodId || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    // ── Return existing product if matched ──────────────────────────────────
    const existing = await Product.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    }).lean()

    if (existing) {
      return NextResponse.json(
        {
          ...existing,
          id: existing._id.toString(),
          _id: existing._id.toString(),
          defaultStorageMethodId: existing.defaultStorageMethodId.toString(),
        },
        { status: 200 }
      )
    }

    // ── Shelf-life resolution: DB entry → category defaults → generic ───────
    //
    // Priority:
    //  1. Caller supplies specific numeric values (body.baseShelfLifeDays etc.)
    //  2. Our knowledge base has an entry matching the product name
    //  3. Category-level defaults (much more realistic than 14d-for-everything)
    //  4. Hard-coded generic fallback (last resort)

    const knownEntry = lookupShelfLife(name)
    const categoryDefaults = lookupCategoryDefaults(category)

    // Values supplied by the caller (receipt scanner may not send these)
    const callerBase = Number(body?.baseShelfLifeDays)
    const callerRoom = Number(body?.roomTempShelfLifeDays)
    const callerFridge = Number(body?.fridgeShelfLifeDays)
    const callerFreezer = Number(body?.freezerShelfLifeDays)
    const callerStorage = defaultStorageMethodId || (knownEntry?.defaultStorage ?? categoryDefaults.defaultStorage)

    const resolved = {
      baseShelfLifeDays:
        (Number.isFinite(callerBase) && callerBase > 0) ? callerBase :
        knownEntry ? knownEntry.base :
        categoryDefaults.base,

      roomTempShelfLifeDays:
        (Number.isFinite(callerRoom) && callerRoom >= 0) ? callerRoom :
        knownEntry ? knownEntry.room :
        categoryDefaults.room,

      fridgeShelfLifeDays:
        (Number.isFinite(callerFridge) && callerFridge >= 0) ? callerFridge :
        knownEntry ? knownEntry.fridge :
        categoryDefaults.fridge,

      freezerShelfLifeDays:
        (Number.isFinite(callerFreezer) && callerFreezer >= 0) ? callerFreezer :
        knownEntry ? knownEntry.freezer :
        categoryDefaults.freezer,

      defaultStorageMethodId: callerStorage,
      storageNotes: String(body?.storageNotes || '').trim() || knownEntry?.notes || '',
    }

    const created = await Product.create({
      name,
      category,
      ...resolved,
    })

    return NextResponse.json(
      {
        ...created.toObject(),
        id: created._id.toString(),
        _id: created._id.toString(),
        defaultStorageMethodId: created.defaultStorageMethodId.toString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

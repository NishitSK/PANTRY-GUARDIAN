import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { fetchWeatherDetailed, fetchWeatherByCoords } from '@/lib/weather'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getOrCreateDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  await connectDB()

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
    const user = await getOrCreateDbUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')?.trim() || ''
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')

    if (!city && !(latParam && lonParam)) {
      return NextResponse.json({ error: 'City or coordinates are required' }, { status: 400 })
    }

    let weather
    if (latParam && lonParam) {
      const lat = parseFloat(latParam)
      const lon = parseFloat(lonParam)
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        console.log('Fetching weather by coordinates:', lat, lon)
        weather = await fetchWeatherByCoords(lat, lon)
      }
    }
    if (!weather) {
      console.log('Fetching weather for city fallback:', city)
      weather = city ? await fetchWeatherDetailed(city) : null
    }

    if (!weather) {
      console.warn('Weather data not found for:', city)
      return NextResponse.json({ error: 'Weather data not found' }, { status: 404 })
    }

    console.log('Weather data result:', weather)

    return NextResponse.json(weather, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Get weather error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

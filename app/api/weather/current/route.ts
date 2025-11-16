import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchWeatherDetailed, fetchWeatherByCoords } from '@/lib/weather'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city') || 'London'
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')
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
      weather = await fetchWeatherDetailed(city)
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

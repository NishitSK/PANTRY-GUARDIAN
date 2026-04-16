export type Weather = { tempC: number; humidity: number }
export type WeatherDetailed = Weather & { condition?: string; feelsLikeC?: number; asOf?: number; locationName?: string; lat?: number; lon?: number }

async function geocode(city: string, key?: string): Promise<{ lat: number; lon: number; name?: string } | null> {
  if (!key) return null
  try {
    const r = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`, { cache: 'no-store' })
    if (r.ok) {
      const arr = await r.json()
      if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
        return { lat: arr[0].lat, lon: arr[0].lon, name: [arr[0].name, arr[0].country].filter(Boolean).join(', ') }
      }
    }
  } catch {}
  return null
}

export async function fetchWeather(city: string): Promise<Weather> {
  const detailed = await fetchWeatherDetailed(city)
  if (!detailed) throw new Error('Weather unavailable')
  return { tempC: detailed.tempC, humidity: detailed.humidity }
}

export async function getCurrentWeather(city: string): Promise<Weather | null> {
  try {
    return await fetchWeather(city)
  } catch {
    return null
  }
}

export async function fetchWeatherDetailed(city: string): Promise<WeatherDetailed | null> {
  const key = process.env.WEATHER_API_KEY
  console.log(`[Weather] Fetching for city: ${city}, Key exists: ${!!key}`)
  if (key) {
    try {
      const g = await geocode(city, key)
      const base = g ? `lat=${g.lat}&lon=${g.lon}` : `q=${encodeURIComponent(city)}`
      const url = `https://api.openweathermap.org/data/2.5/weather?${base}&units=metric&appid=${key}`
      console.log(`[Weather] Fetching URL: ${url.replace(key, 'HIDDEN')}`)
      
      const resp = await fetch(url, { 
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (resp.ok) {
        const data = await resp.json()
        console.log(`[Weather] API Response for ${city}:`, JSON.stringify(data).substring(0, 100) + '...')
        const tempC = typeof data?.main?.temp === 'number' ? data.main.temp : 8
        const feelsLikeC = typeof data?.main?.feels_like === 'number' ? data.main.feels_like : undefined
        const humidity = typeof data?.main?.humidity === 'number' ? data.main.humidity : 55
        const condition = Array.isArray(data?.weather) && data.weather[0]?.main ? String(data.weather[0].main) : undefined
        const asOf = typeof data?.dt === 'number' ? data.dt : undefined
        const stationName = typeof data?.name === 'string' ? data.name : undefined
        const locationName = g?.name || stationName
        return { tempC, feelsLikeC, humidity, condition, asOf, locationName, lat: g?.lat, lon: g?.lon }
      } else {
        console.error(`[Weather] API Error: ${resp.status} ${resp.statusText}`)
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
    }
  } else {
    console.warn('[Weather] No API key found')
  }
  return null
}

// Reverse geocode coordinates to get human city name (more precise than station name)
async function reverseGeocodeFromCoords(lat: number, lon: number, key: string): Promise<string | undefined> {
  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`
    const resp = await fetch(url, { cache: 'no-store' })
    if (resp.ok) {
      const data = await resp.json()
      if (Array.isArray(data) && data.length > 0) {
        return typeof data[0]?.name === 'string' ? data[0].name : undefined
      }
    }
  } catch (error) {
    console.error('Reverse geocode error:', error)
  }
  return undefined
}

// New: fetch weather directly by coordinates (preferred when available)
export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherDetailed | null> {
  const key = process.env.WEATHER_API_KEY
  if (!key) {
    return null
  }
  try {
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    if (resp.ok) {
      const data = await resp.json()
      const tempC = typeof data?.main?.temp === 'number' ? data.main.temp : 10
      const feelsLikeC = typeof data?.main?.feels_like === 'number' ? data.main.feels_like : undefined
      const humidity = typeof data?.main?.humidity === 'number' ? data.main.humidity : 60
      const condition = Array.isArray(data?.weather) && data.weather[0]?.main ? String(data.weather[0].main) : undefined
      const asOf = typeof data?.dt === 'number' ? data.dt : undefined
      // Prefer reverse geocoded city name; fallback to station name
      const preciseName = await reverseGeocodeFromCoords(lat, lon, key)
      const stationName = typeof data?.name === 'string' ? data.name : 'Unknown'
      const locationName = preciseName || stationName
      return { tempC, feelsLikeC, humidity, condition, asOf, locationName, lat, lon }
    }
  } catch (err) {
    console.error('Weather by coords fetch error:', err)
  }
  return null
}

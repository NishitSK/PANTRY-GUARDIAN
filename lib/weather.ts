export type Weather = { tempC: number; humidity: number }
export type WeatherDetailed = Weather & { condition?: string; feelsLikeC?: number; asOf?: number; locationName?: string; lat?: number; lon?: number }

async function geocode(city: string, key?: string): Promise<{ lat: number; lon: number; name?: string } | null> {
  if (!key) return { lat: 52.52, lon: 13.405, name: city }
  try {
    const r = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`, { cache: 'no-store' })
    if (r.ok) {
      const arr = await r.json()
      if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
        return { lat: arr[0].lat, lon: arr[0].lon, name: [arr[0].name, arr[0].country].filter(Boolean).join(', ') }
      }
    }
  } catch {}
  return { lat: 52.52, lon: 13.405, name: city }
}

export async function fetchWeather(city: string): Promise<Weather> {
  const detailed = await fetchWeatherDetailed(city)
  return { tempC: detailed.tempC, humidity: detailed.humidity }
}

export async function getCurrentWeather(city: string): Promise<Weather | null> {
  try {
    return await fetchWeather(city)
  } catch {
    return null
  }
}

export async function fetchWeatherDetailed(city: string): Promise<WeatherDetailed> {
  const key = process.env.WEATHER_API_KEY
  if (key) {
    try {
      const g = await geocode(city, key)
      const base = g ? `lat=${g.lat}&lon=${g.lon}` : `q=${encodeURIComponent(city)}`
      const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?${base}&units=metric&appid=${key}`, { 
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      if (resp.ok) {
        const data = await resp.json()
        const tempC = typeof data?.main?.temp === 'number' ? data.main.temp : 8
        const feelsLikeC = typeof data?.main?.feels_like === 'number' ? data.main.feels_like : undefined
        const humidity = typeof data?.main?.humidity === 'number' ? data.main.humidity : 55
        const condition = Array.isArray(data?.weather) && data.weather[0]?.main ? String(data.weather[0].main) : undefined
        const asOf = typeof data?.dt === 'number' ? data.dt : undefined
        const locationName = g?.name || (typeof data?.name === 'string' ? data.name : undefined)
        return { tempC, feelsLikeC, humidity, condition, asOf, locationName, lat: g?.lat, lon: g?.lon }
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
    }
  }
  return { tempC: 10, humidity: 60, condition: 'Clear', locationName: city }
}

// New: fetch weather directly by coordinates (preferred when available)
export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherDetailed> {
  const key = process.env.WEATHER_API_KEY
  if (!key) {
    return { tempC: 10, humidity: 60, condition: 'Clear', locationName: 'Unknown', lat, lon }
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
      const locationName = typeof data?.name === 'string' ? data.name : 'Unknown'
      return { tempC, feelsLikeC, humidity, condition, asOf, locationName, lat, lon }
    }
  } catch (err) {
    console.error('Weather by coords fetch error:', err)
  }
  return { tempC: 10, humidity: 60, condition: 'Clear', locationName: 'Unknown', lat, lon }
}

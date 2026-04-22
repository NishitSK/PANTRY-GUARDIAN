'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getApiBaseUrl } from '@/lib/api'

export default function InsightsLocationWeather() {
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string } | null>(null)
  const [fetchingWeather, setFetchingWeather] = useState(false)

  useEffect(() => {
    // Load user city
    ;(async () => {
      try {
        const baseUrl = getApiBaseUrl()
        const r = await fetch(`${baseUrl}/api/user/profile`, { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          const c = (data.city || '').trim()
          setCity(c)
          if (c) {
            await fetchWeather(c)
          }
        }
      } catch (e) {
        console.error('Failed to load profile', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const fetchWeather = async (targetCity: string) => {
    setFetchingWeather(true)
    try {
      console.log('Fetching weather for:', targetCity)
      const cleanCity = targetCity.replace(/\b(taluk|district)\b/gi, '').trim()
      const baseUrl = getApiBaseUrl()
      const r = await fetch(`${baseUrl}/api/weather/current?city=${encodeURIComponent(cleanCity)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (r.ok) {
        const data = await r.json()
        setWeather({ tempC: data.tempC, humidity: data.humidity, locationName: data.locationName || targetCity })
      } else {
        setMsg('Weather service unavailable')
      }
    } catch (e) {
      console.error('Weather fetch failed', e)
      setMsg('Failed to fetch weather data')
    } finally {
      setFetchingWeather(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const baseUrl = getApiBaseUrl()
      const r = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
      })
      if (r.ok) {
        setMsg('Location saved. Weather updated.')
        const trimmedCity = city.trim()
        if (trimmedCity) {
          await fetchWeather(trimmedCity)
        } else {
          setWeather(null)
        }
        setTimeout(() => setMsg(''), 2500)
      } else {
        setMsg('Failed to save location')
      }
    } catch {
      setMsg('Error saving location')
    } finally {
      setSaving(false)
    }
  }

  const handleDetect = async () => {
    setMsg('Detecting your location via GPS...')
    if (!navigator.geolocation) {
      setMsg('Geolocation not supported. Enter city manually.')
      return
    }
    
    try {
      // Use high accuracy GPS with longer timeout
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // If high accuracy times out, try with lower accuracy
            if (error.code === error.TIMEOUT) {
              setMsg('GPS taking longer, trying network location...')
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
              )
            } else {
              reject(error)
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
      })

      const { latitude, longitude, accuracy } = position.coords
      const locationSource = accuracy < 100 ? 'GPS' : 'Network'
      console.log(`Location detected via ${locationSource} (accuracy: ${Math.round(accuracy)}m)`)
      setMsg(`Location detected via ${locationSource} (±${Math.round(accuracy)}m). Fetching city name...`)

      const baseUrl = getApiBaseUrl()
      const r = await fetch(`${baseUrl}/api/weather/current?lat=${latitude}&lon=${longitude}&t=${Date.now()}`, { cache: 'no-store' })
      
      if (r.ok) {
        const data = await r.json()
        const detected = data?.locationName
        if (detected) {
          setCity(detected)
          setMsg(`Detected: ${detected} (via ${locationSource}, ±${Math.round(accuracy)}m). Click Save to use it.`)
        } else {
          setMsg('Got coordinates but could not determine city. Enter manually.')
        }
        setWeather({ tempC: data.tempC, humidity: data.humidity, locationName: data.locationName })
      } else {
        setMsg('Could not fetch location data. Enter city manually.')
      }
    } catch (err: any) {
      console.warn('Geolocation error', err)
      if (err.code === 1) {
        setMsg('Location permission denied. Please enable location access or enter city manually.')
      } else if (err.code === 2) {
        setMsg('Location unavailable. Please check GPS/location settings or enter city manually.')
      } else if (err.code === 3) {
        setMsg('Location request timed out. Try again or enter city manually.')
      } else {
        setMsg('Failed to detect location. Enter city manually.')
      }
    }
  }

  return (
    <Card className="!rounded-none !border-4 !border-black !shadow-[6px_6px_0_#000] !bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-black uppercase tracking-[0.12em] text-black mb-1">Insights Location</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Mumbai, Delhi, Bengaluru"
            className="w-full px-3 py-2 border-2 border-black focus:outline-none bg-white text-black"
          />
          <p className="text-[10px] text-black/70 mt-1 font-black uppercase tracking-[0.08em]">Used for weather analytics and navbar display.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDetect} className="bg-[#93E1A8] text-black border-2 border-black hover:bg-black hover:text-white">Detect</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#FFE66D] text-black border-2 border-black hover:bg-black hover:text-white">{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      {msg && (
        <div className="mt-3 p-3 bg-[#FFF3C4] border-2 border-black text-black text-xs font-black uppercase tracking-[0.08em]">{msg}</div>
      )}

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-black text-center">
          <div className="text-[10px] text-black/70 font-black uppercase tracking-[0.12em]">Temperature</div>
          <div className="text-2xl font-bold text-black">
            {fetchingWeather ? '...' : (weather ? `${Math.round(weather.tempC)}°C` : '-')}
          </div>
        </div>
        <div className="p-4 bg-white border-2 border-black text-center">
          <div className="text-[10px] text-black/70 font-black uppercase tracking-[0.12em]">Humidity</div>
          <div className="text-2xl font-bold text-black">
            {fetchingWeather ? '...' : (weather ? `${Math.round(weather.humidity)}%` : '-')}
          </div>
        </div>
        <div className="p-4 bg-white border-2 border-black text-center">
          <div className="text-[10px] text-black/70 font-black uppercase tracking-[0.12em]">Location</div>
          <div className="text-base font-bold text-black">{weather?.locationName || city || '-'}</div>
        </div>
        <div className="p-4 bg-white border-2 border-black text-center">
          <div className="text-[10px] text-black/70 font-black uppercase tracking-[0.12em]">Updated</div>
          <div className="text-base font-bold text-black">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </Card>
  )
}

'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function InsightsLocationWeather() {
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string } | null>(null)

  useEffect(() => {
    // Load user city
    ;(async () => {
      try {
        const r = await fetch('/api/user/profile', { cache: 'no-store' })
        if (r.ok) {
          const data = await r.json()
          const c = data.city || 'London'
          setCity(c)
          await fetchWeather(c)
        }
      } catch (e) {
        console.error('Failed to load profile', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const fetchWeather = async (targetCity: string) => {
    try {
      const r = await fetch(`/api/weather/current?city=${encodeURIComponent(targetCity)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (r.ok) {
        const data = await r.json()
        setWeather({ tempC: data.tempC, humidity: data.humidity, locationName: data.locationName || targetCity })
      }
    } catch (e) {
      console.error('Weather fetch failed', e)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const r = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
      })
      if (r.ok) {
        setMsg('Location saved. Weather updated.')
        await fetchWeather(city)
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

  const handleDetect = () => {
    setMsg('Detecting your location...')
    if (!navigator.geolocation) {
      setMsg('Geolocation not supported. Enter city manually.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          // Ask our API for weather + resolved name; no API keys on client
          const r = await fetch(`/api/weather/current?lat=${latitude}&lon=${longitude}&t=${Date.now()}`, { cache: 'no-store' })
          if (r.ok) {
            const data = await r.json()
            const detected = data?.locationName
            if (detected) {
              setCity(detected)
              setMsg(`Detected: ${detected}. Save to use it across the app.`)
            } else {
              setMsg('Detected coordinates. Save to use a city name.')
            }
            setWeather({ tempC: data.tempC, humidity: data.humidity, locationName: data.locationName })
          } else {
            setMsg('Could not detect via API. Enter city manually.')
          }
        } catch (e) {
          console.error('Detect fetch failed', e)
          setMsg('Failed to detect city')
        }
      },
      (err) => {
        console.warn('Geolocation error', err)
        setMsg('Permission denied or unavailable. Enter city manually.')
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Insights Location</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Mumbai, Delhi, Bengaluru"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">Used for weather-based analytics and shown in the navbar.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDetect} className="bg-blue-600 hover:bg-blue-700">📍 Detect</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      {msg && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">{msg}</div>
      )}

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
          <div className="text-xs text-gray-500 uppercase">Temperature</div>
          <div className="text-2xl font-bold text-green-700">{weather ? Math.round(weather.tempC) : '-'}°C</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
          <div className="text-xs text-gray-500 uppercase">Humidity</div>
          <div className="text-2xl font-bold text-green-700">{weather ? Math.round(weather.humidity) : '-'}%</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
          <div className="text-xs text-gray-500 uppercase">Location</div>
          <div className="text-base font-medium text-gray-800">{weather?.locationName || city || '-'}</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
          <div className="text-xs text-gray-500 uppercase">Updated</div>
          <div className="text-base font-medium text-gray-800">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </Card>
  )
}

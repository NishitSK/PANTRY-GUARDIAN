'use client'
import React, { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/lib/api'
import { Thermometer, Droplets, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WeatherChip() {
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string; feelsLikeC?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string>('')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchUserCity() }, [])

  useEffect(() => {
    if (coords) {
      fetchWeather()
      const interval = setInterval(fetchWeather, 10 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [coords])

  useEffect(() => {
    if (!coords && userCity) {
      fetchWeather()
      const interval = setInterval(fetchWeather, 10 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [userCity, coords])

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const fetchUserCity = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setUserCity(data.city || '')
      } else {
        setUserCity('')
        setLoading(false)
      }
    } catch {
      setUserCity('')
      setLoading(false)
    }
  }

  const fetchWeather = async () => {
    try {
      setRefreshing(true)
      const cleanCity = userCity.replace(/\b(taluk|district)\b/gi, '').trim()
      if (!coords && !cleanCity) {
        setWeather(null)
        setLoading(false)
        return
      }
      const baseUrl = getApiBaseUrl()
      const query = coords ? `lat=${coords.lat}&lon=${coords.lon}` : `city=${encodeURIComponent(cleanCity)}`
      const response = await fetch(`${baseUrl}/api/weather/current?${query}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (response.ok) {
        const data = await response.json()
        setWeather({
          tempC: data.tempC,
          humidity: data.humidity,
          locationName: data.locationName,
          feelsLikeC: typeof data.feelsLikeC === 'number' ? data.feelsLikeC : undefined,
        })
        setLastUpdated(Date.now())
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getDisplayLocation = () => {
    const name = weather?.locationName?.split(',')[0] || userCity
    return name.replace(/\b(taluk|district)\b/gi, '').trim()
  }

  const isStale = lastUpdated ? Date.now() - lastUpdated > 15 * 60 * 1000 : false
  const tooltip = weather?.locationName
    ? `${weather.locationName} • Updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ''}`
    : userCity

  if (loading) {
    return (
      <div className="flex items-center gap-2 w-full px-3 py-2 bg-white border-2 border-black shadow-[3px_3px_0_#000]">
        <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        <span className="text-[10px] text-black font-black uppercase tracking-[0.14em]">Fetching weather</span>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="flex items-center gap-2 w-full px-3 py-2 bg-white border-2 border-black border-dashed">
        <div className="p-1.5 bg-[#FFE66D] border border-black text-black shrink-0">
          <Thermometer className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-black font-black uppercase tracking-[0.14em]">Set location in settings</span>
      </div>
    )
  }

  return (
    <div
      className="w-full p-3 bg-white border-2 border-black shadow-[4px_4px_0_#000]"
      title={tooltip}
    >
      {/* Row 1: temperature + location */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 bg-[#93E1A8] border border-black text-black shrink-0">
          <Thermometer className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-black leading-none">{weather.tempC.toFixed(0)}°C</p>
          <p className="text-[10px] font-black text-black/60 mt-0.5 truncate uppercase tracking-[0.08em]">
            {getDisplayLocation()}
          </p>
        </div>
      </div>

      {/* Row 2: humidity + refresh — clearly separated */}
      <div className="flex items-center justify-between gap-1 mt-1">
        <div className="flex items-center gap-1 bg-[#FFE66D] border-2 border-black px-1.5 py-0.5 min-w-0">
          <Droplets className="w-3 h-3 text-black shrink-0" />
          <span className="text-[9px] font-black text-black uppercase tracking-tight truncate">
            {Math.round(weather.humidity)}% hum
          </span>
        </div>
        <button
          onClick={fetchWeather}
          title="Refresh weather"
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 border-2 border-black transition-all text-[9px] font-black uppercase tracking-tighter shrink-0",
            isStale ? "bg-[#FFE66D] text-black" : "bg-white text-black hover:bg-black hover:text-white"
          )}
        >
          {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          Refresh
        </button>
      </div>
    </div>
  )
}

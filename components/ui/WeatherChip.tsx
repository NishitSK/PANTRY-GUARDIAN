'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function WeatherChip() {
  const { data: session } = useSession()
  const [weather, setWeather] = useState<{ tempC: number; humidity: number; locationName?: string; feelsLikeC?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string>('London')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    fetchUserCity()
  }, [session])

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

  // Attempt geolocation for higher accuracy once
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        },
        () => {
          // ignore errors, fall back to city
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const fetchUserCity = async () => {
    if (!session?.user?.email) return
    
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserCity(data.city || 'London')
      }
    } catch (error) {
      console.error('Failed to fetch user city:', error)
      setUserCity('London')
    }
  }

  const fetchWeather = async () => {
    try {
      const query = coords ? `lat=${coords.lat}&lon=${coords.lon}` : `city=${encodeURIComponent(userCity)}`
      const response = await fetch(`/api/weather/current?${query}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Weather fetched:', data)
        setWeather({ 
          tempC: data.tempC, 
          humidity: data.humidity,
          locationName: data.locationName,
          feelsLikeC: typeof data.feelsLikeC === 'number' ? data.feelsLikeC : undefined
        })
        setLastUpdated(Date.now())
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-green-100">
        <span className="text-xs text-gray-500">Loading weather...</span>
      </div>
    )
  }

  if (!weather) return null
  
  const tooltip = weather.locationName ? `${weather.locationName} • Updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ''}` : userCity
  const isStale = lastUpdated ? (Date.now() - lastUpdated) > 15 * 60 * 1000 : false
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-green-100" title={tooltip}>
      <div className="flex items-center gap-1">
        <span className="text-xl">🌡️</span>
        <span className="text-sm font-medium text-gray-700">{weather.tempC.toFixed(1)}°C</span>
      </div>
      <div className="w-px h-4 bg-gray-300"/>
      <div className="flex items-center gap-1">
        <span className="text-xl">💧</span>
        <span className="text-sm font-medium text-gray-700">{Math.round(weather.humidity)}%</span>
      </div>
      {typeof weather.feelsLikeC === 'number' && (
        <>
          <div className="w-px h-4 bg-gray-300"/>
          <span className="text-xs text-gray-600">feels {weather.feelsLikeC.toFixed(1)}°C</span>
        </>
      )}
      {weather.locationName && (
        <>
          <div className="w-px h-4 bg-gray-300"/>
          <span className="text-xs text-gray-600 font-medium">{weather.locationName.split(',')[0]}</span>
        </>
      )}
      <button
        onClick={fetchWeather}
        className={`ml-1 text-xs px-2 py-1 rounded-md border ${isStale ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        aria-label="Refresh weather"
        title={isStale ? 'Data may be stale (>15m). Click to refresh.' : 'Refresh now'}
      >↻</button>
    </div>
  )
}

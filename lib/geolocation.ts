import { getApiBaseUrl } from './api'

/**
 * Reverse geocode coordinates to get city name
 * Uses backend proxy to avoid CORS issues
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const baseUrl = getApiBaseUrl()
    
    // First, get weather data by coordinates (which includes location name)
    const response = await fetch(
      `${baseUrl}/api/weather/current?lat=${latitude}&lon=${longitude}`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.locationName || data.city || null
    }
    
    return null
  } catch (error) {
    console.error('Reverse geocode failed:', error)
    return null
  }
}

/**
 * Get user's geolocation coordinates
 */
export function getUserCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Detect user's city using geolocation
 * Returns city name or null if detection fails
 */
export async function detectUserCity(): Promise<string | null> {
  try {
    const coords = await getUserCoordinates()
    return await reverseGeocode(coords.latitude, coords.longitude)
  } catch (error) {
    console.error('City detection failed:', error)
    return null
  }
}

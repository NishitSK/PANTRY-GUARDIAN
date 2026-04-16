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
 * Get user's geolocation coordinates using device GPS
 * Uses high accuracy mode with extended timeout for GPS fix
 */
export function getUserCoordinates(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    // First try with high accuracy (GPS) - longer timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('GPS Location obtained:', {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: position.coords.accuracy < 100 ? 'GPS' : 'Network/IP'
        })
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        console.warn('High accuracy geolocation failed:', error.message)
        
        // If high accuracy fails, try with lower accuracy as fallback
        if (error.code === error.TIMEOUT) {
          console.log('Retrying with lower accuracy...')
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Network location obtained:', {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracy: position.coords.accuracy
              })
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              })
            },
            (fallbackError) => {
              reject(fallbackError)
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000 // Allow cached position up to 1 minute old
            }
          )
        } else {
          reject(error)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds for GPS to get a fix
        maximumAge: 0 // Don't use cached position for high accuracy
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
    console.log(`Location detected with accuracy: ${coords.accuracy}m`)
    return await reverseGeocode(coords.latitude, coords.longitude)
  } catch (error) {
    console.error('City detection failed:', error)
    return null
  }
}

/**
 * Check if geolocation permission is granted
 */
export async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt' // Can't check, assume we need to prompt
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'prompt'
  }
}


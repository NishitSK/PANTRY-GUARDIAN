'use client'
import { useState, useEffect } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'

interface LocationPromptProps {
  onLocationSet: (city: string) => void
}

export default function LocationPrompt({ onLocationSet }: LocationPromptProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [city, setCity] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if user has already set location
    const locationSet = localStorage.getItem('locationPromptShown')
    if (!locationSet) {
      setIsOpen(true)
    }
  }, [])

  const handleDetectLocation = () => {
    setDetecting(true)
    setMessage('Detecting your location...')
    
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser')
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=7f2cc4799a7f2199aa43a90578920042`)
          const data = await response.json()
          
          if (data && data[0]?.name) {
            const detectedCity = data[0].name
            setCity(detectedCity)
            setMessage(`Detected: ${detectedCity}`)
          } else {
            setMessage('Could not determine city. Please enter manually.')
          }
        } catch (error) {
          setMessage('Failed to detect location')
        } finally {
          setDetecting(false)
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setMessage('Permission denied. Please enter city manually.')
        } else {
          setMessage('Failed to get location. Please enter manually.')
        }
        setDetecting(false)
      }
    )
  }

  const handleSubmit = async () => {
    if (!city) return

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
      })

      if (response.ok) {
        localStorage.setItem('locationPromptShown', 'true')
        setIsOpen(false)
        onLocationSet(city)
      } else {
        setMessage('Failed to save location')
      }
    } catch (error) {
      setMessage('An error occurred')
    }
  }

  const handleSkip = () => {
    localStorage.setItem('locationPromptShown', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Pantry Guardian!</h2>
            <p className="text-gray-600">
              We'll use your location to provide accurate weather-based shelf life predictions.
            </p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <Button
              type="button"
              onClick={handleDetectLocation}
              disabled={detecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {detecting ? 'Detecting...' : '📍 Auto-detect my location'}
            </Button>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={!city} className="flex-1">
                Save Location
              </Button>
              <Button onClick={handleSkip} className="bg-gray-500 hover:bg-gray-600">
                Skip
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You can change this later in Settings
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

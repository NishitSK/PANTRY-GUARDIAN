'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getApiBaseUrl } from '@/lib/api'
import { detectUserCity } from '@/lib/geolocation'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setCity(data.city || 'London')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDetectLocation = async () => {
    setMessage('Detecting your location...')
    
    try {
      const detectedCity = await detectUserCity()
      
      if (detectedCity) {
        setCity(detectedCity)
        setMessage(`Location detected: ${detectedCity}. Click Update to save.`)
      } else {
        setMessage('Could not determine city name from your location')
      }
    } catch (error: any) {
      if (error.message.includes('not supported')) {
        setMessage('Geolocation is not supported by your browser')
      } else if (error.code === 1) {
        setMessage('Location permission denied. Please enter city manually.')
      } else {
        setMessage('Failed to get your location. Please enter city manually.')
      }
    }
  }

  const handleUpdateCity = async () => {
    setSaving(true)
    setMessage('')
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
      })

      if (response.ok) {
        setMessage('Location updated successfully! Weather will update shortly.')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to update location')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/login')
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SectionHeading>Settings</SectionHeading>
        <p className="text-gray-600 mt-2">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <Card>
          <h3 className="font-semibold text-lg mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={session?.user?.name || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (City)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., London, Mumbai, New York"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Button onClick={handleUpdateCity} disabled={saving}>
                  {saving ? 'Saving...' : 'Update'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  📍 Detect my location
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for weather-based shelf life predictions
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">Prediction Model</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">Rule-Based Model v1.1</span>
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm text-green-800">
                Storage-aware shelf life predictions with room temperature, refrigerator, 
                and freezer-specific calculations.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Storage method-specific shelf life</li>
                <li>• Temperature and humidity adjustments</li>
                <li>• Opened item penalty calculations</li>
                <li>• Weather condition integration</li>
                <li>• Category-based rules</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">Date Format</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium text-blue-900">Indian Format (DD/MM/YY)</p>
                <p className="text-sm text-blue-800 mt-1">
                  Example: 10/11/25 for November 10, 2025
                </p>
              </div>
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                Active
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">About</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Pantry Guardian</p>
              <p className="text-xs text-gray-600">Intelligent Grocery Shelf-Life & Pantry Manager</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Version:</span> 1.0.0
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Model:</span> rb-1.1 (Rule-Based)
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Database:</span> 159 Products across 12 categories
              </p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                This application uses advanced prediction algorithms to help reduce food waste 
                by providing accurate expiry date predictions based on storage conditions, 
                product characteristics, and environmental factors.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

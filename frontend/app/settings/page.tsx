'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/shadcn-button'
import { ArrowLeft } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api'
import { detectUserCity } from '@/lib/geolocation'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push('/auth/login')
      setLoading(false)
      return
    }

    if (isSignedIn) {
      fetchUserProfile()
    }
  }, [isLoaded, isSignedIn, router])

  const fetchUserProfile = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setCity(data.city || '')
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

  if (!isLoaded || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </main>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <main className="container mx-auto overflow-x-hidden px-2 sm:px-4 py-6 sm:py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 mb-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
        <SectionHeading>Settings</SectionHeading>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'}`}>
            {message}
          </div>
        )}

        <Card>
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={user?.fullName || user?.firstName || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.primaryEmailAddress?.emailAddress || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location (City)
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., London, Mumbai, New York"
                  className="flex-1 min-h-11 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Button onClick={handleUpdateCity} disabled={saving} className="min-h-11 bg-[#FFE66D] text-black border-2 border-black hover:bg-black hover:text-white">
                  {saving ? 'Saving...' : 'Update'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black hover:bg-black hover:text-white transition-colors"
                >
                  <span>📍</span>
                  <span>Detect my location</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for weather-based shelf life predictions
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Prediction Model</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900 dark:text-green-100">Rule-Based Model v1.1</span>
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Storage-aware shelf life predictions with room temperature, refrigerator, 
                and freezer-specific calculations.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Features:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
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
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Date Format</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Indian Format (DD/MM/YY)</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
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
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">About</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pantry Guardian</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Intelligent Grocery Shelf-Life & Pantry Manager</p>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Version:</span> 1.0.0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Model:</span> rb-1.1 (Rule-Based)
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Database:</span> 159 Products across 12 categories
              </p>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This application uses advanced prediction algorithms to help reduce food waste 
                by providing accurate expiry date predictions based on storage conditions, 
                product characteristics, and environmental factors.
              </p>
            </div>
          </div>
        </Card>
        </div>

        <div className="hidden lg:block sticky top-24 h-fit">
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
              alt="Pantry organization"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
              <p className="text-white font-medium text-lg">
                &quot;Organizing is what you do before you do something, so that when you do it, it is not all mixed up.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

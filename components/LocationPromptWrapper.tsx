'use client'
import { useState } from 'react'
import LocationPrompt from './LocationPrompt'

export default function LocationPromptWrapper() {
  const [, setLocationSet] = useState(false)

  const handleLocationSet = (city: string) => {
    setLocationSet(true)
    // Refresh the page to update weather
    window.location.reload()
  }

  return <LocationPrompt onLocationSet={handleLocationSet} />
}

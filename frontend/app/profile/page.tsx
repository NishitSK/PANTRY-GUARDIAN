'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Package, Calendar, MapPin, User as UserIcon, ArrowLeft, LogOut, ShieldCheck, Sparkles, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiBaseUrl } from '@/lib/api'

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    city: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/login')
    }
  }, [isLoaded, isSignedIn, router])

  const fetchUserProfile = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          city: data.city || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchUserProfile()
    }
  }, [user, fetchUserProfile])


  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: formData.city })
      })

      if (response.ok) {
        setMessage('Your curator identity has been updated.')
        setProfile({ ...profile, ...formData })
        setEditMode(false)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to update identity.')
      }
    } catch (error) {
      setMessage('An error occurred.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
            <Sparkles className="h-10 w-10 text-gold shadow-gold-glow" />
        </motion.div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F6F1E7] p-3 sm:p-6 font-manrope md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-10 md:mb-14 flex flex-col justify-between gap-6 md:gap-8 md:flex-row md:items-center">
            <div className="space-y-4">
            <Link href="/dashboard" className="group inline-flex items-center border-2 border-black bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Archive to Dashboard
                </Link>
                <div className="flex items-center gap-3">
              <span className="border-2 border-black bg-[#DDF5E3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">Curator&apos;s Portfolio</span>
              <div className="h-[2px] w-12 bg-black" />
                </div>
            <h1 className="font-noto-serif text-4xl sm:text-6xl text-black">The Curator&apos;s Identity</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => signOut({ redirectUrl: '/' })}
              className="group min-h-11 flex items-center justify-center gap-3 border-2 border-black bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                >
                    <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Exit Kitchen
                </button>
                {!editMode && (
                    <button 
                        onClick={() => setEditMode(true)}
                className="min-h-11 border-2 border-black bg-[#93E1A8] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                    >
                        Modify Identity
                    </button>
                )}
            </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              className="mb-10 flex items-center gap-4 border-2 border-black bg-[#DDE8FF] p-4 shadow-[6px_6px_0_#000]"
            >
              <div className="border border-black bg-[#FFE66D] p-2">
                <ShieldCheck className="h-5 w-5 text-black" />
                </div>
              <p className="text-sm font-bold text-black">{message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* Dossier Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="group relative overflow-hidden border-4 border-black bg-white p-6 sm:p-10 text-center shadow-[10px_10px_0_#000]">
                    
                    <div className="relative z-10">
                        {user?.imageUrl ? (
                           <Image 
                             src={user.imageUrl} 
                             alt="Profile" 
                             width={128} 
                             height={128} 
                             className="mx-auto mb-8 h-32 w-32 border-4 border-black object-cover transition-transform duration-300 group-hover:scale-105" 
                             unoptimized 
                           />
                        ) : (
                    <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center border-4 border-black bg-[#FFE66D] text-5xl font-noto-serif text-black transition-transform duration-300 group-hover:scale-105">
                                 {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                  <h2 className="mb-2 font-noto-serif text-3xl sm:text-4xl italic tracking-tight text-black">{user?.fullName || profile.name}</h2>
                  <p className="inline-block border-2 border-black bg-[#DDF5E3] px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-black">Premium Curator</p>
                        
                  <div className="mt-10 grid grid-cols-2 gap-6 border-t-2 border-black pt-6">
                            <div className="text-left">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-black/60">Items Guided</p>
                      <p className="font-noto-serif text-3xl text-black">{profile.stats?.totalItems || 0}</p>
                            </div>
                            <div className="text-left">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-black/60">Curation Value</p>
                      <p className="font-noto-serif text-3xl text-black">₹{profile.stats?.totalValue?.toLocaleString('en-IN') || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

              <div className="group relative overflow-hidden border-4 border-black bg-white p-8 shadow-[10px_10px_0_#000]">
                    <div className="flex items-center gap-4 mb-6">
                  <div className="border-2 border-black bg-[#FFE66D] p-3 text-black">
                            <Award className="h-6 w-6" />
                        </div>
                  <h3 className="font-noto-serif text-xl italic text-black">Kitchen Accomplishments</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-black/70">Master Preservation</span>
                    <span className="font-bold text-black">Lvl 4</span>
                        </div>
                  <div className="h-2 w-full overflow-hidden border border-black bg-[#F6F1E7]">
                    <div className="h-full w-[70%] bg-[#93E1A8]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Portfolio Content */}
            <div className="lg:col-span-8 space-y-12">
              <section className="relative border-4 border-black bg-white p-6 sm:p-10 shadow-[10px_10px_0_#000]">
                    <div className="flex items-center gap-3 mb-10">
                  <UserIcon className="h-4 w-4 text-black" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/65">Documentary Details</h3>
                    </div>
                    
                    <div className="space-y-12">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-3 relative group">
                              <label className="pl-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/60">Legal Name</label>
                              <div className="border-b-2 border-black py-3 font-noto-serif text-3xl italic text-black">
                                    {profile.name}
                                </div>
                            </div>
                             <div className="space-y-3 relative group">
                              <label className="pl-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/60">Communication Channel</label>
                              <div className="border-b-2 border-black py-3 font-manrope text-xl font-semibold text-black">
                                    {user?.primaryEmailAddress?.emailAddress || profile.email}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-3 relative group">
                              <label className="pl-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/60">Primary Location</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                  className="w-full border-b-2 border-black bg-transparent py-3 font-manrope text-xl font-semibold text-black outline-none"
                                        placeholder="Mumbai, IN"
                                    />
                                ) : (
                                <div className="border-b-2 border-black py-3 font-manrope text-xl font-semibold text-black">
                                        {profile.city || 'Undisclosed'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3 relative group">
                              <label className="pl-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/60">Established Since</label>
                              <div className="flex items-center gap-3 border-b-2 border-black py-3 font-noto-serif text-3xl text-black">
                                <Calendar className="h-4 w-4 text-black" />
                                    {formatDate(profile.createdAt)}
                                </div>
                            </div>
                        </div>

                        {editMode && (
                            <div className="flex flex-col sm:flex-row justify-end pt-8 gap-3 sm:gap-4">
                                <button 
                                    onClick={() => {
                                        setEditMode(false)
                                        setFormData({ name: profile.name, city: profile.city })
                                    }}
                                className="min-h-11 border-2 border-black bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={saving}
                                className="min-h-11 border-2 border-black bg-[#93E1A8] px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                                >
                                    {saving ? 'Updating identity' : 'Seal Identity'}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Dossier Footer */}
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="flex items-center gap-6 border-4 border-black bg-white p-8 shadow-[8px_8px_0_#000]">
                    <div className="border-2 border-black bg-[#FFE66D] p-4 text-black">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Digital Vault Version</p>
                      <p className="font-noto-serif text-3xl text-black">V. 4.0.2 Curator Alpha</p>
                        </div>
                     </div>
                   <div className="flex items-center gap-6 border-4 border-black bg-white p-8 shadow-[8px_8px_0_#000]">
                    <div className="border-2 border-black bg-[#FFE66D] p-4 text-black">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Active Server Node</p>
                      <p className="font-noto-serif text-3xl text-black">Primary Tier Mumbai</p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  )
}

"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/shadcn-button'
import WeatherChip from '@/components/ui/WeatherChip'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { href: '/', label: 'Website' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/add', label: 'Add Item' },
  { href: '/insights', label: 'Insights' },
  { href: '/settings', label: 'Settings' },
]

export default function Header() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 max-w-full overflow-x-hidden border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="flex h-16 min-w-0 items-center justify-between gap-2 sm:gap-3">
          {/* Left: Brand */}
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/dashboard" className="inline-flex min-w-0 items-center gap-2 sm:gap-3 border-2 border-black bg-surface px-2 sm:px-3 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <img src="/logo.png" alt="Pantry Guardian logo" className="h-9 w-9 object-contain" />
              <span className="hidden sm:inline font-anton text-xl uppercase tracking-[0.08em] text-textMain">
                Pantry Guardian
              </span>
            </Link>
          </div>

          {/* Center: Nav (Desktop) */}
          {isSignedIn && (
            <nav className="hidden items-center gap-2 md:flex">
              {links.map(l => {
                const active = pathname === l.href
                const base = 'border-2 border-black px-3 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] transition-transform hover:-translate-y-1'
                const cls = active
                  ? `${base} bg-primary text-black`
                  : `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10`
                return (
                  <Link key={l.href} href={l.href} prefetch className={cls}>{l.label}</Link>
                )
              })}
            </nav>
          )}

          {/* Right: Utilities */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <div className="hidden sm:block">
              <WeatherChip />
            </div>
            
            {/* Mobile Menu Toggle */}
            {isSignedIn && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="border-2 border-black bg-[#FFE66D] text-black hover:bg-black hover:text-white md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            {isSignedIn ? (
              <SignOutButton redirectUrl="/auth/login">
                <Button variant="ghost" className="hidden md:inline-flex border-2 border-black bg-white text-black hover:bg-black hover:text-white px-3 py-2">Sign out</Button>
              </SignOutButton>
            ) : (
              <div className="flex min-w-0 gap-1 sm:gap-2">
                 <Link href="/auth/login"><Button variant="ghost" size="sm" className="border-2 border-black bg-white px-2 text-[10px] text-black hover:bg-black hover:text-white sm:px-3 sm:text-sm">Login</Button></Link>
                 <Link href="/auth/login"><Button size="sm" className="border-2 border-black bg-[#FFE66D] px-2 text-[10px] text-black hover:bg-black hover:text-white sm:px-3 sm:text-sm">Start</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && isSignedIn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden border-t-2 border-black bg-background md:hidden"
          >
            <div className="space-y-4 p-3 sm:p-4">
              <div className="flex min-w-0 items-center justify-between border-b-2 border-black pb-4">
                 <WeatherChip />
              </div>
              <nav className="flex flex-col gap-2">
                {links.map(l => {
                  const active = pathname === l.href
                  return (
                    <Link 
                      key={l.href} 
                      href={l.href}
                      prefetch={false}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`border-2 border-black px-4 py-3 font-ibm-mono text-[10px] uppercase tracking-[0.28em] transition-colors ${
                        active 
                          ? 'bg-primary text-black' 
                          : 'text-textMain hover:bg-black hover:text-white'
                      }`}
                    >
                      {l.label}
                    </Link>
                  )
                })}
                <SignOutButton redirectUrl="/auth/login">
                  <button 
                    className="border-2 border-black px-4 py-3 text-left font-ibm-mono text-[10px] uppercase tracking-[0.28em] bg-white text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Sign out
                  </button>
                </SignOutButton>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

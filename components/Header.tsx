"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Button from '@/components/ui/Button'
import WeatherChip from '@/components/ui/WeatherChip'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/add', label: 'Add Item' },
  { href: '/insights', label: 'Insights' },
  { href: '/settings', label: 'Settings' },
]

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-2">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-600"/>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                <span className="text-brand-700 dark:text-brand-300">Pantry</span> Guardian
              </span>
            </Link>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => {
              const active = pathname === l.href
              const base = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors'
              const cls = active
                ? `${base} bg-brand-600 text-white shadow-sm`
                : `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10`
              return (
                <Link key={l.href} href={l.href} className={cls}>{l.label}</Link>
              )
            })}
          </nav>

          {/* Right: Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            <WeatherChip />
            <Button variant="ghost" className="px-3 py-2" onClick={()=>signOut({ callbackUrl: '/auth/login' })}>Sign out</Button>
          </div>
        </div>
      </div>
    </header>
  )
}

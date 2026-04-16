'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import WeatherChip from '@/components/ui/WeatherChip'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Inventory', href: '/inventory', icon: 'inventory_2' },
  { name: 'Add Item', href: '/add', icon: 'add_circle' },
  { name: 'Recipe Gallery', href: '/recipes', icon: 'menu_book' },
  { name: 'Insights', href: '/insights', icon: 'analytics' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <div className="hidden md:flex h-screen min-h-0 w-72 flex-col bg-[#F6F1E7] border-r-4 border-black z-50 overflow-hidden">
      {/* Brand Header */}
      <div className="shrink-0 flex flex-col justify-center px-6 py-4 border-b-4 border-black bg-white">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="Pantry Guardian logo" className="h-8 w-8 border-2 border-black bg-white object-contain" />
          <span className="ml-0.5 text-xl font-noto-serif font-bold text-black tracking-tight leading-none">Pantry Guardian</span>
        </div>
        <p className="mt-1.5 ml-0.5 text-[9px] font-manrope font-black uppercase tracking-[0.24em] text-black">Brutalist inventory control</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Navigation */}
        <nav className="flex-1 min-h-0 space-y-2 px-3 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] border-2 border-black transition-all duration-200',
                  isActive
                    ? 'bg-[#FFE66D] text-black shadow-[4px_4px_0_#000]'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-xl transition-all duration-300',
                    isActive ? 'text-black scale-110' : 'text-black'
                  )}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-manrope tracking-tight">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User & Settings */}
        <div className="shrink-0 p-4 space-y-3 border-t-4 border-black bg-[#F6F1E7]">
        <div className="flex items-center gap-2">
          <WeatherChip />
        </div>

        <Link href="/settings" className={cn(
          "flex items-center gap-4 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] border-2 border-black transition-all",
          pathname === '/settings' ? 'bg-[#93E1A8] text-black shadow-[4px_4px_0_#000]' : 'bg-white text-black hover:bg-black hover:text-white'
        )}>
          <span className="material-symbols-outlined text-2xl">settings</span>
          <span className="font-manrope">Settings</span>
        </Link>
        
        <div className="mt-1 px-3 py-3 bg-white border-2 border-black shadow-[4px_4px_0_#000]">
          <div className="flex items-center gap-3">
          {user?.imageUrl ? (
             <img src={user.imageUrl} alt="Profile" className="h-10 w-10 border-2 border-black object-cover" />
          ) : (
            <div className="h-10 w-10 bg-[#FFE66D] border-2 border-black flex items-center justify-center text-black font-bold font-noto-serif">
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-black truncate">{user?.fullName || 'Julian Vane'}</span>
            <span className="text-[10px] text-black font-black uppercase tracking-widest truncate">Premium Curator</span>
          </div>
          </div>
          <SignOutButton redirectUrl="/auth/login">
            <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-black bg-[#FFE66D] text-black transition-all hover:bg-black hover:text-white">
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="font-manrope">Logout</span>
            </button>
          </SignOutButton>
          <Link href="/" className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-black/50 hover:text-black transition-colors py-1">
            <span className="material-symbols-outlined text-xs">open_in_new</span>
            Landing page
          </Link>
        </div>
        </div>
      </div>
    </div>
  )
}

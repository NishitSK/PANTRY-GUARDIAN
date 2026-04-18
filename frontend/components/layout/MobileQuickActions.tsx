'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Package, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

const actions = [
  { href: '/add', label: 'Add', icon: Plus },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
]

export default function MobileQuickActions() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-black bg-[#F6F1E7] px-1 py-2 md:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex gap-1 max-w-xl">
        {actions.map((action) => {
          const Icon = action.icon
          const active = pathname.startsWith(action.href)
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex-1 flex min-h-[48px] items-center justify-center gap-1.5 border-2 border-black px-1 py-2 text-[9px] font-black uppercase tracking-tight transition-colors",
                active ? 'bg-[#FFE66D] text-black shadow-[2px_2px_0_#000]' : 'bg-white text-black hover:bg-black hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

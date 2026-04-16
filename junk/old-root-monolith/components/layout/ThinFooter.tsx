"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type ThinFooterProps = {
  scope: 'public' | 'dashboard'
}

export default function ThinFooter({ scope }: ThinFooterProps) {
  const pathname = usePathname()
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/inventory') || pathname.startsWith('/add') || pathname.startsWith('/insights') || pathname.startsWith('/recipes') || pathname.startsWith('/settings') || pathname.startsWith('/profile')

  if ((scope === 'public' && isDashboardRoute) || (scope === 'dashboard' && !isDashboardRoute)) {
    return null
  }

  return (
    <footer className="thin-footer border-t-2 border-black bg-background px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">
          Pantry Guardian / Freshness control system
        </p>
        <div className="flex flex-wrap gap-3 font-ibm-mono text-[10px] uppercase tracking-[0.26em] text-textMain">
          <Link href="/about" className="transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/qna" className="transition-colors hover:text-primary">
            Q&A
          </Link>
          <Link href="/support" className="transition-colors hover:text-primary">
            Support
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-primary">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
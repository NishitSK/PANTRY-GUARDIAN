'use client'

import Sidebar from './Sidebar'
import Header from '@/components/Header'
import RouteWarmup from '@/components/RouteWarmup'
import SpoilageNotifier from '@/components/SpoilageNotifier'
import ThinFooter from './ThinFooter'
import MobileQuickActions from './MobileQuickActions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row bg-muted/10 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden">
        <Header />
      </div>
      
      {/* Desktop Sidebar - Wrapped to check layout */}
      <Sidebar />

      <RouteWarmup />
      <SpoilageNotifier />
      
      <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-4 sm:pb-24 md:p-6 md:pb-6 transition-all duration-300">
        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          {children}
        </div>
        <ThinFooter scope="dashboard" />
      </main>
      <MobileQuickActions />
    </div>
  )
}

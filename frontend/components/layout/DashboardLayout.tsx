'use client'

import Sidebar from './Sidebar'
import Header from '@/components/Header'
import RouteWarmup from '@/components/RouteWarmup'
import SpoilageNotifier from '@/components/SpoilageNotifier'
import ThinFooter from './ThinFooter'
import MobileQuickActions from './MobileQuickActions'
import RefreshAfterInventoryChange from '@/components/RefreshAfterInventoryChange'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden md:h-screen md:flex-row bg-muted/10">
      {/* Mobile Header */}
      <div className="md:hidden">
        <Header />
      </div>
      
      {/* Desktop Sidebar - Wrapped to check layout */}
      <Sidebar />

      <RouteWarmup />
      <SpoilageNotifier />
      <RefreshAfterInventoryChange />
      
      <main className="min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-6 pb-24 sm:pb-24 md:pb-6 transition-all duration-300 flex flex-col items-center">
        <div className="w-full max-w-full mx-auto md:max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          {children}
        </div>
        <ThinFooter scope="dashboard" />
      </main>
      <MobileQuickActions />
    </div>
  )
}

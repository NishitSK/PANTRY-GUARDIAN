import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'Pantry Guardian',
  description: 'Intelligent Grocery Shelf-Life & Pantry Manager'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
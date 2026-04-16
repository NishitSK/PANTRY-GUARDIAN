import './globals.css'
import { ReactNode } from 'react'
import Providers from '@/components/Providers'
import ThinFooter from '@/components/layout/ThinFooter'
import PwaInstaller from '@/components/PwaInstaller'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'
import type { Viewport } from 'next'
import { Anton, IBM_Plex_Mono, Outfit, Fraunces, Noto_Serif, Manrope } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
})

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-mono',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-noto-serif',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '600', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'Pantry Guardian',
  description: 'Brutalist grocery shelf-life and pantry manager.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'blockButton',
          showOptionalFields: false,
        },
        variables: {
          colorPrimary: '#ccff00',
        },
        elements: {
          rootBox: 'w-full',
          cardBox: 'w-full bg-surface border-2 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] rounded-none',
          header: 'space-y-4',
          headerTitle: 'font-anton uppercase tracking-[0.12em] text-textMain',
          headerSubtitle: 'font-ibm-mono text-textMuted',
          main: 'space-y-6',
          footer: 'mt-8 pt-6 border-t-2 border-black',
          footerAction: 'font-ibm-mono text-[10px] uppercase tracking-[0.28em] justify-center',
          footerActionLink: 'underline decoration-2 underline-offset-4',
          footerPages: 'hidden',
          footerPagesLink: 'hidden',
          socialButtonsRoot: 'space-y-4',
          socialButtons: 'space-y-3',
          socialButtonsBlockButton: 'rounded-none border-2 border-black bg-background py-4 font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMain shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
          socialButtonsBlockButtonText: 'font-ibm-mono text-[10px] uppercase tracking-[0.28em]',
          dividerRow: 'py-2',
          dividerText: 'font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted',
          formFieldRow: 'space-y-2',
          formField: 'space-y-2',
          formFieldLabel: 'font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted',
          formFieldInput: 'rounded-none border-2 border-black bg-background px-4 py-3 font-ibm-mono text-sm text-textMain shadow-none focus:border-black focus:ring-0',
          formButtonPrimary: 'rounded-none border-2 border-black bg-primary py-4 font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${anton.variable} ${ibmMono.variable} ${outfit.variable} ${fraunces.variable} ${notoSerif.variable} ${manrope.variable}`}
      >
        <head>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          />
        </head>
        <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-300 flex flex-col">
          <PwaInstaller />
          <PushNotificationPrompt />
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Providers>{children}</Providers>
            </div>
            <ThinFooter scope="public" />
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}

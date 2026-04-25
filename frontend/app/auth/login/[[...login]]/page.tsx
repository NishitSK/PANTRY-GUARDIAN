'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignIn } from '@clerk/nextjs'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'

const pillars = [
  'Fast access to live inventory.',
  'Expiry warnings that stay visible.',
  'A dashboard built for decisions, not browsing.',
]

export default function LoginPage() {
  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-background text-textMain">
      <div className="grid min-h-screen min-w-0 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative flex min-w-0 flex-col justify-between border-b-2 border-black bg-surface p-3 sm:p-6 lg:border-b-0 lg:border-r-2 lg:p-10 xl:p-14">
          <div className="absolute inset-0 brutalist-grid opacity-40" />

          <div className="relative z-10 space-y-10">
            <div className="flex min-w-0 flex-col gap-3 border-2 border-black bg-background px-4 py-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
              <Link href="/" className="truncate font-anton text-xl sm:text-2xl uppercase tracking-[0.08em]">
                Pantry Guardian
              </Link>
              <span className="border-2 border-black bg-primary px-3 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-black">
                Login / 01
              </span>
            </div>

            <div className="max-w-3xl space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-ibm-mono text-[10px] uppercase tracking-[0.4em] text-textMuted"
              >
                Returning users only
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="max-w-2xl break-words font-anton text-4xl min-[380px]:text-5xl sm:text-7xl uppercase leading-[0.9] xl:text-[6.5rem]"
              >
                Re-enter the
                <span className="block text-primary">control room.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="max-w-xl border-l-4 border-black pl-4 font-ibm-mono text-sm uppercase leading-7 tracking-[0.16em] text-textMuted"
              >
                Sign in to inspect stock, resolve urgency, and keep the pantry readable.
              </motion.p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar} className="brutalist-stat">
                  <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">Signal</p>
                  <p className="mt-2 font-anton text-2xl uppercase leading-[0.95]">{pillar}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-2">
            <div className="border-2 border-black bg-black p-4 text-white">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-white/60">State</p>
              <p className="mt-3 font-anton text-4xl uppercase leading-none text-primary">Live</p>
            </div>
            <div className="border-2 border-black bg-background p-4">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-textMuted">Outcome</p>
              <p className="mt-3 font-anton text-4xl uppercase leading-none">Fast</p>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center p-3 sm:p-6 xl:p-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-xl overflow-hidden border-2 border-black bg-surface p-4 shadow-[12px_12px_0_0_rgba(0,0,0,1)] sm:p-8"
          >
            <div className="mb-6 border-2 border-black bg-black px-4 py-3 text-white">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-white/60">Secure access</p>
              <p className="mt-2 font-anton text-4xl uppercase leading-none">Sign in</p>
            </div>

            <GoogleAuthButton mode="signIn" />
            <SignIn
              path="/auth/login"
              routing="path"
              forceRedirectUrl="/dashboard"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                layout: {
                  socialButtonsPlacement: 'top',
                  socialButtonsVariant: 'blockButton',
                  showOptionalFields: false,
                },
                elements: {
                  rootBox: 'w-full',
                  cardBox: 'w-full rounded-none border-2 border-black bg-surface p-0 shadow-none',
                  header: 'space-y-4',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  main: 'space-y-6',
                  footer: 'mt-8 pt-6 border-t-2 border-black',
                  footerAction: 'hidden',
                  footerActionLink: 'hidden',
                  footerPages: 'hidden',
                  footerPagesLink: 'hidden',
                  socialButtonsRoot: 'hidden',
                  socialButtons: 'hidden',
                  socialButtonsBlockButton: 'hidden',
                  formButtonPrimary: 'rounded-none border-2 border-black bg-primary py-4 font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
                  formFieldInput: 'rounded-none border-2 border-black bg-background px-4 py-3 font-ibm-mono text-sm text-textMain shadow-none focus:border-black focus:ring-0',
                  formFieldLabel: 'mb-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted',
                  dividerLine: 'hidden',
                  dividerText: 'hidden',
                },
              }}
              signUpUrl="/auth/signup"
            />

            <p className="pt-8 text-center font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">
              First time here?{' '}
              <Link href="/auth/signup" className="text-textMain underline decoration-2 underline-offset-4">
                Create an account
              </Link>
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}

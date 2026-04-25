'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignUp } from '@clerk/nextjs'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'

const pillars = [
  'Create a profile built for food control.',
  'Turn scanning into a habit, not a chore.',
  'Bring order to the pantry from day one.',
]

export default function SignupPage() {
  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-background text-textMain">
      <div className="grid min-h-screen min-w-0 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="order-2 flex min-w-0 items-center justify-center p-3 sm:p-6 lg:order-1 xl:p-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-xl overflow-hidden border-2 border-black bg-surface p-4 shadow-[12px_12px_0_0_rgba(0,0,0,1)] sm:p-8"
          >
            <div className="mb-6 border-2 border-black bg-black px-4 py-3 text-white">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-white/60">Open access</p>
              <p className="mt-2 font-anton text-4xl uppercase leading-none">Create account</p>
            </div>

            <GoogleAuthButton mode="signUp" />
            <SignUp
              path="/auth/signup"
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
              signInUrl="/auth/login"
            />

            <p className="pt-8 text-center font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">
              Already inside?{' '}
              <Link href="/auth/login" className="text-textMain underline decoration-2 underline-offset-4">
                Sign in
              </Link>
            </p>
          </motion.div>
        </section>

        <section className="relative order-1 flex min-w-0 flex-col justify-between border-b-2 border-black bg-black p-3 sm:p-6 text-white lg:order-2 lg:border-b-0 lg:border-l-2 lg:p-10 xl:p-14">
          <div className="absolute inset-0 brutalist-grid opacity-30" />

          <div className="relative z-10 space-y-10">
            <div className="flex min-w-0 flex-col gap-3 border-2 border-white bg-black px-4 py-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
              <Link href="/" className="truncate font-anton text-xl sm:text-2xl uppercase tracking-[0.08em] text-white">
                Pantry Guardian
              </Link>
              <span className="border-2 border-white bg-primary px-3 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-black">
                Signup / 01
              </span>
            </div>

            <div className="max-w-3xl space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-ibm-mono text-[10px] uppercase tracking-[0.4em] text-white/60"
              >
                New accounts only
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="max-w-2xl break-words font-anton text-4xl min-[380px]:text-5xl sm:text-7xl uppercase leading-[0.9] xl:text-[6.5rem]"
              >
                Build the
                <span className="block text-primary">inventory system.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="max-w-xl border-l-4 border-white pl-4 font-ibm-mono text-sm uppercase leading-7 tracking-[0.16em] text-white/70"
              >
                Start with a clean account and turn pantry noise into a structured system.
              </motion.p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar} className="border-2 border-white bg-white/5 p-4 text-white">
                  <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-white/60">Signal</p>
                  <p className="mt-2 font-anton text-2xl uppercase leading-[0.95]">{pillar}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-2">
            <div className="border-2 border-white bg-primary p-4 text-black">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-black/70">State</p>
              <p className="mt-3 font-anton text-4xl uppercase leading-none">Fresh</p>
            </div>
            <div className="border-2 border-white bg-black p-4 text-white">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Outcome</p>
              <p className="mt-3 font-anton text-4xl uppercase leading-none text-primary">Ordered</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

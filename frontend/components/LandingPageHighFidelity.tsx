"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Box, ScanLine, ShieldAlert, TriangleAlert, UserRound } from "lucide-react"
import { Button } from "@/components/ui/shadcn-button"
import { useUser } from '@clerk/nextjs'

const principles = [
  {
    step: "01",
    title: "SCAN",
    copy: "Capture receipts, shelves, or single items without friction. The interface treats input as inventory, not decoration.",
    icon: ScanLine,
  },
  {
    step: "02",
    title: "DECIDE",
    copy: "Everything gets a verdict: use now, freeze, donate, or discard. No vague recommendations and no soft language.",
    icon: TriangleAlert,
  },
  {
    step: "03",
    title: "EXECUTE",
    copy: "Move fast with a system that makes the right action obvious. The pantry becomes legible, measurable, and controllable.",
    icon: ShieldAlert,
  },
]

const stats = [
  { label: "Items tracked (avg. household/year)", value: "320" },
  { label: "Expiry alerts (avg. household/year)", value: "38" },
  { label: "Estimated waste by expired food (national avg./year)", value: "75–100 KG" },
]

const workflow = [
  "Open the camera and capture a shelf or receipt.",
  "Auto-classify products by urgency, quantity, and storage method.",
  "Push the right action into view before stock goes bad.",
  "Use the dashboard as a control surface, not a report archive.",
]

export default function LandingPageHighFidelity() {
  const { isSignedIn, user } = useUser()

  return (
    <main className="min-h-screen max-w-full bg-background text-textMain overflow-hidden selection:bg-primary selection:text-black">
      <header className="sticky top-0 z-50 border-b-2 border-black bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-2 px-2 py-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/icon.svg"
              alt="Pantry Guardian logo"
              className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-black bg-white object-contain shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            />
            <div>
              <p className="truncate font-anton text-lg sm:text-2xl uppercase tracking-[0.08em] leading-none">Pantry Guardian</p>
              <p className="hidden sm:block font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">Brutalist inventory control</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              { label: 'About', href: '/about' },
              { label: 'Q&A', href: '/qna' },
              { label: 'Support', href: '/support' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="border-2 border-black px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] transition-transform hover:-translate-y-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="min-h-11 px-2 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.3em] sm:px-4">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile" className="inline-flex min-h-11 items-center gap-2 border-2 border-black bg-[#FFE66D] px-1.5 sm:px-2 py-1.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="h-8 w-8 border-2 border-black object-cover" />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                  <span className="hidden sm:inline max-w-[110px] truncate font-ibm-mono text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {user?.firstName || user?.fullName || 'Profile'}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="min-h-11 px-2 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.3em] sm:px-4">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="min-h-11 px-2 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.3em] sm:px-4">
                    Start
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative border-b-2 border-black">
        <div className="absolute inset-0 brutalist-grid opacity-50" />
        <div className="mx-auto grid max-w-7xl gap-6 px-2 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex min-w-0 flex-col justify-between gap-8 border-2 border-black bg-surface p-4 shadow-[12px_12px_0_0_rgba(0,0,0,1)] sm:p-8 lg:min-h-[760px]"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="brutalist-tag">System / 01</span>
                <span className="border-2 border-black px-3 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.28em]">
                  Expiry logic turned visible
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <p className="font-ibm-mono text-[10px] uppercase tracking-[0.4em] text-textMuted">
                  Pantry Guardian
                </p>
                <h1 className="max-w-4xl break-words font-anton text-5xl uppercase leading-[0.9] sm:text-7xl lg:text-[7.5rem]">
                  Waste Is a
                  <span className="block text-primary">Design Problem.</span>
                </h1>
                <p className="max-w-2xl border-l-4 border-black pl-4 font-ibm-mono text-sm uppercase leading-7 tracking-[0.16em] text-textMuted sm:text-base">
                  Brutal inventory control for kitchens that need fewer decisions and faster action. Track,
                  sort, and rescue food before it becomes loss.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={isSignedIn ? '/dashboard' : '/auth/signup'}>
                  <Button size="lg" className="w-full justify-between sm:w-auto">
                    {isSignedIn ? 'Open dashboard' : 'Start tracking'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Open dashboard
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="brutalist-stat">
                  <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">{stat.label}</p>
                  <p className="mt-2 font-anton text-4xl uppercase leading-none">{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative z-10 flex min-h-[560px] min-w-0 flex-col justify-between gap-6 border-2 border-black bg-black p-4 text-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] sm:min-h-[760px] sm:p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-2 border-white px-3 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.32em] text-white">
                <span>Control surface</span>
                <span>Live</span>
              </div>

              <div className="relative overflow-hidden border-2 border-white bg-[#121212]">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop"
                  alt="Kitchen inventory"
                  className="h-[320px] w-full object-cover grayscale contrast-125 sm:h-[420px]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.35))]" />
                <div className="absolute left-4 top-4 border-2 border-white bg-black px-3 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em]">
                  Frame 01
                </div>
                <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
                  <div className="border-2 border-white bg-black/90 p-3">
                    <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">Primary alert</p>
                    <p className="mt-1 font-anton text-3xl uppercase leading-none text-primary">Bananas</p>
                  </div>
                  <div className="border-2 border-white bg-black/90 p-3">
                    <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">Action</p>
                    <p className="mt-1 font-anton text-3xl uppercase leading-none">Use tonight</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-2 border-white p-4">
                <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-textMuted">Rule</p>
                <p className="mt-2 font-anton text-3xl uppercase leading-none">No Guessing</p>
              </div>
              <div className="border-2 border-white p-4">
                <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-textMuted">Signal</p>
                <p className="mt-2 font-anton text-3xl uppercase leading-none">No Clutter</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="border-b-2 border-black bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">How it works</span>
            <div className="brutalist-rule flex-1" />
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {workflow.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08 }}
                className="brutalist-panel p-5"
              >
                <p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">0{index + 1}</p>
                <p className="mt-4 font-anton text-3xl uppercase leading-[0.95]">Step {index + 1}</p>
                <p className="mt-4 font-ibm-mono text-sm leading-7 text-textMuted">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="brutalist-panel p-6 sm:p-8">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">Principles</p>
              <h2 className="mt-4 font-anton text-5xl uppercase leading-[0.9] sm:text-6xl">
                A system that
                <span className="block text-primary">says what to do.</span>
              </h2>
              <p className="mt-6 max-w-xl font-ibm-mono text-sm uppercase leading-7 tracking-[0.16em] text-textMuted">
                No softness in the controls. No decorative noise. Every surface is there to shorten the path
                from seeing a problem to fixing it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {principles.map((principle, index) => {
                const Icon = principle.icon
                return (
                  <motion.div
                    key={principle.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ delay: index * 0.08 }}
                    className="brutalist-panel flex h-full flex-col justify-between gap-6 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">{principle.step}</span>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-anton text-3xl uppercase leading-[0.95]">{principle.title}</h3>
                      <p className="mt-4 font-ibm-mono text-sm leading-7 text-textMuted">{principle.copy}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 border-2 border-black bg-primary p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-black/70">Final signal</p>
              <h2 className="mt-4 max-w-3xl font-anton text-5xl uppercase leading-[0.92] text-black sm:text-6xl lg:text-7xl">
                Stop guessing. Start running the pantry like a system.
              </h2>
            </div>

            <div className="flex flex-col justify-between gap-6 border-2 border-black bg-background p-6">
              <p className="font-ibm-mono text-sm uppercase leading-7 tracking-[0.18em] text-textMain">
                Get a dashboard built for quick decisions, loud hierarchy, and visible urgency.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full justify-between sm:w-auto">
                    Create account
                    <Box className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-black bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">
            Pantry Guardian / Brutalist interface system
          </p>
          <div className="flex flex-wrap gap-3 font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-textMain">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Support', href: '/support' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="border-2 border-black px-3 py-2 transition-transform hover:-translate-y-1">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}

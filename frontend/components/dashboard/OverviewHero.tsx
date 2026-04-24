"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Plus } from "lucide-react"

interface OverviewHeroProps {
  userName?: string
  purity?: number
  itemsTracked?: number
  toRestock?: number
  isEmpty?: boolean
  urgentItemName?: string | null
}

export default function OverviewHero({
  userName = "Chef",
  purity = 0,
  itemsTracked = 0,
  toRestock = 0,
  isEmpty = false,
  urgentItemName = null,
}: OverviewHeroProps) {

  // Progress ring math
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (purity / 100) * circumference

  return (
    <div className="relative max-w-full overflow-hidden bg-[#F6F1E7] min-h-[400px] mt-4 mb-8 sm:mt-8 sm:mb-12 p-2 sm:p-6 font-sans border-4 border-black shadow-[10px_10px_0_#000] flex items-center justify-center">

      {/* Brutalist Background Blocks */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -left-10 -top-10 h-40 w-40 bg-[#FFE66D] border-4 border-black rotate-12 opacity-50 sm:opacity-100" />
        <div className="absolute right-8 top-8 h-16 w-16 bg-[#93E1A8] border-2 border-black" />
      </div>

      {/* Main Panel */}
      <div className="relative z-10 w-full max-w-full min-w-0 bg-white border-4 border-black shadow-[8px_8px_0_#000] p-4 sm:p-10 transition-all duration-300 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

        {isEmpty ? (
          /* ── EMPTY STATE ── */
          <div className="flex flex-col items-center text-center max-w-lg mx-auto py-2 sm:py-6 gap-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/50 mb-4">Getting started</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-black leading-tight mb-4 tracking-tight break-words">
                Welcome, <span className="bg-[#FFE66D] px-2">{userName}</span>.<br />
                Your pantry is <span className="bg-black text-white px-2">empty</span>.
              </h1>
              <p className="text-base text-black/70 font-manrope leading-relaxed max-w-sm mx-auto mb-8">
                Add your first item to start tracking freshness, getting recipe suggestions, and reducing food waste.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link href="/add">
                <button className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFE66D] border-2 border-black px-5 sm:px-8 py-4 font-black uppercase tracking-[0.12em] text-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:-translate-y-1 hover:shadow-none transition-all">
                  <Plus className="h-5 w-5" />
                  Add first item
                </button>
              </Link>
            </motion.div>

            <div className="mt-2 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:gap-6">
              <div className="bg-[#F6F1E7] px-3 sm:px-6 py-4 border-2 border-black text-center">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black/50 mb-1">Items Tracked</p>
                <p className="text-3xl font-noto-serif font-bold text-black">0</p>
              </div>
              <div className="bg-[#F6F1E7] px-3 sm:px-6 py-4 border-2 border-black text-center">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black/50 mb-1">To Restock</p>
                <p className="text-3xl font-noto-serif font-bold text-black">0</p>
              </div>
            </div>
          </div>
        ) : (
          /* ── DATA STATE ── */
          <>
            <div className="relative z-10 w-full min-w-0 max-w-2xl text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-3xl sm:text-5xl md:text-6xl font-black text-black leading-tight mb-4 tracking-tight break-words"
              >
                Good morning, <span className="bg-[#FFE66D] px-2">{userName}</span>.<br />
                Your kitchen is <span className="bg-[#93E1A8] px-2">{purity}%</span> prime.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mx-auto text-base sm:text-lg text-black/80 font-medium max-w-md leading-relaxed lg:mx-0"
              >
                {urgentItemName
                  ? <>The <strong>{urgentItemName}</strong> in your pantry is expiring soon — use it today to avoid waste.</>
                  : <>All items in prime condition. Keep it up.</>
                }
              </motion.p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:flex sm:gap-6 sm:flex-wrap">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-[#FFE66D] px-3 sm:px-8 py-5 border-2 border-black"
                >
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black mb-2">Items Tracked</p>
                  <p className="text-4xl font-noto-serif font-bold text-black">{itemsTracked}</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-[#93E1A8] px-3 sm:px-8 py-5 border-2 border-black"
                >
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black mb-2">Expiring Soon</p>
                  <p className="text-4xl font-noto-serif font-bold text-black">{toRestock}</p>
                </motion.div>
              </div>
            </div>

            {/* Pantry Health Progress Ring — only shown when data exists */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center shrink-0 overflow-visible">
              <svg className="h-full w-full -rotate-90 overflow-visible" viewBox="0 0 224 224" aria-hidden="true">
                <circle
                  className="text-black/10"
                  cx="112" cy="112" fill="transparent" r={radius}
                  stroke="currentColor" strokeWidth="8"
                />
                <motion.circle
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-black"
                  cx="112" cy="112" fill="transparent" r={radius}
                  stroke="currentColor" strokeDasharray={circumference}
                  strokeWidth="12" strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex max-w-[80%] flex-col items-center bg-white border-2 border-black px-3 sm:px-4 py-2 sm:py-3 text-center">
                <span className="text-3xl sm:text-5xl font-noto-serif font-bold text-black">{purity}%</span>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-black mt-1">Pantry Health</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

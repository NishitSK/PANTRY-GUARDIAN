'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Camera, Zap } from 'lucide-react'
import ReceiptScanModal from './ReceiptScanModal'

export default function QuickActions() {
  const [scanOpen, setScanOpen] = useState(false)

  return (
    <>
      <div className="max-w-full bg-black text-white p-5 sm:p-8 border-4 border-black shadow-[10px_10px_0_#93E1A8]">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="p-3 bg-white text-black border-2 border-black">
            <Zap className="h-6 w-6 text-black" />
          </div>
          <h3 className="text-xl font-noto-serif font-bold">Quick Actions</h3>
        </div>

        <div className="space-y-4">
          <Link href="/add">
            <button className="w-full bg-[#FFE66D] text-black font-black py-4 px-3 border-2 border-black hover:translate-x-1 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-sm sm:text-base">
              <Plus className="h-5 w-5" />
              Add Single Item
            </button>
          </Link>

          <button
            onClick={() => setScanOpen(true)}
            className="w-full bg-[#93E1A8] border-2 border-black text-black font-black py-4 px-3 hover:translate-x-1 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-sm sm:text-base"
          >
            <Camera className="h-5 w-5" />
            Scan Grocery Receipt
          </button>
        </div>
      </div>

      {scanOpen && <ReceiptScanModal onClose={() => setScanOpen(false)} />}
    </>
  )
}

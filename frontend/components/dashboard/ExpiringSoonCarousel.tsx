"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ExpiringItem {
  _id: string
  name: string
  daysLeft: number
  category: string
  image?: string
}

interface ExpiringSoonCarouselProps {
  items: ExpiringItem[]
}

export default function ExpiringSoonCarousel({ items }: ExpiringSoonCarouselProps) {
  if (items.length === 0) return null

  return (
    <section className="mb-12 border-4 border-black bg-[#F4F4EF] shadow-[8px_8px_0_#000]">
      <div className="flex items-center justify-between border-b-2 border-black px-4 py-4 sm:px-6">
        <div>
          <h2 className="font-noto-serif text-3xl text-black">Expiring Soon</h2>
          <p className="mt-1 font-manrope text-sm text-black/65">High priority items needing your attention.</p>
        </div>
        <button className="border-2 border-black bg-white px-3 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white">
          View Critical List
        </button>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-6">
        {items.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -2 }}
            className="group border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000]"
          >
            <div className="mb-4 flex items-center justify-between border-2 border-black bg-[#F6F1E7] px-3 py-2">
              <p className="font-ibm-mono text-[10px] font-black uppercase tracking-[0.16em] text-black">{item.category}</p>
              <span
                className={cn(
                  "border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.12em]",
                  item.daysLeft < 0 ? "bg-[#FFD2CC] text-black" : item.daysLeft <= 1 ? "bg-[#FFE66D] text-black" : "bg-[#93E1A8] text-black"
                )}
              >
                {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d left`}
              </span>
            </div>

            <h3 className="font-noto-serif text-3xl font-bold leading-tight text-black">{item.name}</h3>

            <div className="mt-4 border-t-2 border-black pt-3">
              <p className="font-manrope text-sm text-black/75">
                {item.daysLeft < 0
                  ? `Expired ${Math.abs(item.daysLeft)} day${Math.abs(item.daysLeft) === 1 ? "" : "s"} ago`
                  : item.daysLeft === 0
                    ? "Expires today"
                    : `Expires in ${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"}`}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

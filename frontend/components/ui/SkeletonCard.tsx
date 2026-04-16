'use client'

interface SkeletonBlockProps {
  className?: string
}

function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div className={`bg-black/10 animate-pulse border border-black/10 ${className}`} />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0_#000] space-y-4">
      <SkeletonBlock className="h-12 w-12" />
      <SkeletonBlock className="h-10 w-16" />
      <SkeletonBlock className="h-3 w-24" />
    </div>
  )
}

export function SkeletonInventoryRow() {
  return (
    <div className="grid grid-cols-12 px-10 py-8 items-center border-b border-black/10">
      <div className="col-span-5 flex items-center gap-6">
        <SkeletonBlock className="h-14 w-14 shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      </div>
      <div className="col-span-3 flex justify-center">
        <SkeletonBlock className="h-7 w-28" />
      </div>
      <div className="col-span-2 flex justify-center">
        <SkeletonBlock className="h-5 w-16" />
      </div>
      <div className="col-span-2 flex justify-end">
        <div className="w-32 space-y-2">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-1.5 w-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonInventoryCard() {
  return (
    <div className="border-4 border-black bg-[#F4F4EF] p-4 shadow-[6px_6px_0_#000] space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-8 w-32" />
        </div>
        <SkeletonBlock className="h-7 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-black bg-white p-2 space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-5 w-20" />
        </div>
        <div className="border-2 border-black bg-white p-2 space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-5 w-12" />
        </div>
        <div className="col-span-2 border-2 border-black bg-white p-2 space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-5 w-28" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonBlock

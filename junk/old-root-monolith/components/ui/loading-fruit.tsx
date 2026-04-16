"use client"

import { useEffect } from 'react'

export default function LoadingFruit() {
  useEffect(() => {
    document.body.setAttribute('data-pg-loading', 'true')

    return () => {
      document.body.removeAttribute('data-pg-loading')
    }
  }, [])

  return (
    <div className="flex min-h-[280px] items-center justify-center border-2 border-black bg-surface p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <svg
          viewBox="0 0 120 120"
          className="h-16 w-16"
          aria-hidden="true"
        >
          <path
            d="M62 22c2-6 7-10 13-11-1 7-5 12-11 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black"
            style={{ strokeDasharray: 80, strokeDashoffset: 80, animation: 'dash 1.4s ease-in-out infinite alternate' }}
          />
          <path
            d="M58 30c-11-9-27-3-33 11-6 14-2 40 13 54 9 9 18 9 22 4 4-5 10-5 14 0 4 5 13 5 22-4 15-14 19-40 13-54-6-14-22-20-33-11-5 4-13 4-18 0z"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black"
            style={{ strokeDasharray: 360, strokeDashoffset: 360, animation: 'dash 1.6s ease-in-out infinite alternate 0.15s' }}
          />
          <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
        </svg>
        <p className="font-anton text-3xl uppercase leading-none">Loading</p>
        <p className="max-w-xs font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">
          Preparing the inventory view.
        </p>
      </div>
    </div>
  )
}

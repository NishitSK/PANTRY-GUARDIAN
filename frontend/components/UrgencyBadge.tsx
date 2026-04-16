import { ReactNode } from 'react'

export function urgencyColor(u: string) {
  if (u === 'red') return 'bg-red-600'
  if (u === 'orange') return 'bg-orange-500'
  return 'bg-green-600'
}

export default function UrgencyBadge({ level }: { level: 'red'|'orange'|'green' }) {
  const text = level === 'red' ? 'At Risk' : level === 'orange' ? 'Soon' : 'OK'
  return <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${urgencyColor(level)}`}>{text}</span>
}

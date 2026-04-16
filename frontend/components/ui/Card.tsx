import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', children, ...props }: CardProps) {
  const base = 'bg-card text-card-foreground rounded-[2rem] shadow-lg shadow-black/5 border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:shadow-black/5'
  const cls = [base, className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  )
}

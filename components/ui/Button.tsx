"use client"
import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  asChild?: boolean
}

export default function Button({ variant = 'primary', className = '', children, asChild, ...props }: ButtonProps) {
  const base = 'btn'
  const style = variant === 'primary' ? 'btn-primary' : 'btn-ghost'
  const cls = [base, style, className].filter(Boolean).join(' ')
  if (asChild) {
    return <span className={cls}>{children}</span>
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}

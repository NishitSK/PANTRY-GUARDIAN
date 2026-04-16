import React from 'react'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'soft' | 'muted'
}

export default function Badge({ tone='soft', className='', children, ...props }: BadgeProps){
  const base = 'badge'
  const style = tone === 'soft' ? 'badge-soft' : 'badge-muted'
  return <span className={[base, style, className].join(' ')} {...props}>{children}</span>
}

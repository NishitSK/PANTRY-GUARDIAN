import React from 'react'

type SectionHeadingProps = React.HTMLAttributes<HTMLHeadingElement>

export default function SectionHeading({ className='', children, ...props }: SectionHeadingProps){
  return (
    <h2 className={`text-2xl font-bold text-gray-800 dark:text-gray-100 ${className}`} {...props}>
      {children}
    </h2>
  )
}

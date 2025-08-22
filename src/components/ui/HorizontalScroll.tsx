import type { PropsWithChildren } from 'react'

interface HorizontalScrollProps extends PropsWithChildren {
  className?: string
}

export default function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  return (
    <div className={"overflow-x-auto " + (className ?? '')}>
      <div className="min-w-max pr-2 flex items-stretch gap-4">{children}</div>
    </div>
  )
} 
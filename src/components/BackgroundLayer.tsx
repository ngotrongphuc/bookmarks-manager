import { cn } from '@/lib/cn'
import type { Settings } from '@/types'

type BackgroundLayerProps = {
  background: Settings['background']
  className?: string
}

/** Full-page background renderer supporting color, gradient, and image */
export function BackgroundLayer({ background, className }: BackgroundLayerProps) {
  const baseClasses = 'fixed inset-0 -z-10'

  if (background.type === 'image') {
    return (
      <div className={cn(baseClasses, className)}>
        <img src={background.value} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    )
  }

  const style: React.CSSProperties =
    background.type === 'gradient'
      ? { backgroundImage: background.value }
      : { backgroundColor: background.value }

  return <div className={cn(baseClasses, className)} style={style} />
}

import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type AddBookmarkCardProps = {
  gridSize: Settings['gridSize']
  onClick: () => void
  className?: string
}

/** Dashed "+" card for adding a new bookmark */
export function AddBookmarkCard({ gridSize, onClick, className }: AddBookmarkCardProps) {
  const size = GRID_SIZE_MAP[gridSize]

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-center justify-center',
        'rounded-xl border-2 border-dashed border-white/30',
        'text-white/50 transition-all duration-200',
        'hover:border-white/60 hover:text-white/80',
        className,
      )}
      style={{ aspectRatio: `${size.width} / ${size.height + 32}` }}
    >
      <span className="text-3xl font-light">+</span>
      <span className="mt-1 text-xs">Add bookmark</span>
    </button>
  )
}

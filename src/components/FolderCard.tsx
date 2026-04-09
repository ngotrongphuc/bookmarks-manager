import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type FolderCardProps = {
  title: string
  icon?: string
  color?: string
  bookmarkCount: number
  cardStyle: Settings['cardStyle']
  cardOpacity: number
  gridSize: Settings['gridSize']
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

/** Folder card displayed in the bookmark grid — click to enter */
export function FolderCard({
  title,
  icon = '📁',
  color,
  bookmarkCount,
  cardStyle,
  cardOpacity,
  gridSize,
  onClick,
  onContextMenu,
  className,
}: FolderCardProps) {
  const size = GRID_SIZE_MAP[gridSize]

  const cardClasses = cn(
    'group relative flex flex-col overflow-hidden transition-all duration-200',
    'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
    cardStyle === 'rounded' && 'rounded-xl',
    cardStyle === 'sharp' && 'rounded-none',
    cardStyle === 'glass' && 'rounded-xl backdrop-blur-md border border-white/20',
    className,
  )

  const bgStyle: React.CSSProperties = {
    opacity: cardOpacity,
    backgroundColor:
      cardStyle === 'glass' ? 'rgba(255,255,255,0.1)' : 'rgb(30,41,59)',
  }

  return (
    <div
      data-folder-card
      className={cardClasses}
      style={bgStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div
        className="flex flex-col items-center justify-center gap-1"
        style={{ width: size.width, height: size.height }}
      >
        <span className="text-4xl">{icon}</span>
        {color && (
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      <div className="flex flex-col items-center px-2 py-1.5" style={{ width: size.width }}>
        <span
          className="w-full truncate text-center font-medium text-white"
          style={{ fontSize: size.fontSize }}
        >
          {title}
        </span>
        <span className="text-[10px] text-white/40">
          {bookmarkCount} {bookmarkCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  )
}

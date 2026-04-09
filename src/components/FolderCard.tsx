import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type PreviewItem = {
  title: string
  url: string
  thumbnail: string | null
}

type FolderCardProps = {
  title: string
  icon?: string
  color?: string
  bookmarkCount: number
  /** First 4 bookmarks/subfolders for the preview grid */
  previewItems: PreviewItem[]
  cardStyle: Settings['cardStyle']
  cardOpacity: number
  gridSize: Settings['gridSize']
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Folder card with 2x2 preview grid of its contents */
export function FolderCard({
  title,
  icon = '📁',
  color,
  bookmarkCount,
  previewItems,
  cardStyle,
  cardOpacity,
  gridSize,
  onClick,
  onContextMenu,
  className,
}: FolderCardProps) {
  const size = GRID_SIZE_MAP[gridSize]
  const previews = previewItems.slice(0, 4)

  const cardClasses = cn(
    'group relative flex flex-col overflow-hidden transition-all duration-200',
    'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
    cardStyle === 'rounded' && 'rounded-xl',
    cardStyle === 'sharp' && 'rounded-none',
    cardStyle === 'glass' && 'rounded-xl backdrop-blur-md border border-white/20',
    className,
  )

  const bgStyle: React.CSSProperties = {
    backgroundColor:
      cardStyle === 'glass'
        ? `rgba(255,255,255,${0.1 * cardOpacity})`
        : `rgba(30,41,59,${cardOpacity})`,
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
        className="flex items-start justify-center p-1.5 pt-2"
        style={{ width: size.width }}
      >
        {previews.length > 0 ? (
          <div className="grid w-full grid-cols-2 grid-rows-2 gap-1.5">
            {previews.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{ aspectRatio: '1' }}
              >
                <img
                  src={
                    item.thumbnail ??
                    `https://www.google.com/s2/favicons?domain=${getDomain(item.url)}&sz=64`
                  }
                  alt={item.title}
                  className={cn(
                    'object-cover',
                    item.thumbnail ? 'h-full w-full rounded-md' : 'h-6 w-6',
                  )}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-4xl">{icon}</span>
        )}
      </div>

      {/* Color accent bar */}
      {color && (
        <div
          className="mx-auto h-0.5 w-8 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className="flex flex-col items-center px-2 py-1.5"
        style={{ width: size.width }}
      >
        <span
          className="w-full truncate text-center font-medium text-white"
          style={{ fontSize: size.fontSize, lineHeight: '1.4em', minHeight: '1.4em' }}
        >
          {title || '\u00A0'}
        </span>
        <span className="text-[10px] text-white/40">
          {bookmarkCount} {bookmarkCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  )
}

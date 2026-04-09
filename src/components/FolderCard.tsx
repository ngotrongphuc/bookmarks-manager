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
  previewItems: PreviewItem[]
  cardBackdropColor: string
  cardBorderRadius: number
  cardBlur: number
  cardOpacity: number
  gridSize: Settings['gridSize']
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

const FAVICON_SIZE = { small: 20, medium: 30, large: 40 } as const

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
  cardBackdropColor,
  cardBorderRadius,
  cardBlur,
  cardOpacity,
  gridSize,
  onClick,
  onContextMenu,
  className,
}: FolderCardProps) {
  const size = GRID_SIZE_MAP[gridSize]
  const previews = previewItems.slice(0, 4)

  return (
    <div
      data-folder-card
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
        className,
      )}
      style={{ borderRadius: `${cardBorderRadius}px` }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Card wrapper background — affected by cardOpacity */}
      <div
        className="pointer-events-none absolute inset-0 border border-white/10"
        style={{
          backgroundColor: cardBackdropColor,
          borderRadius: `${cardBorderRadius}px`,
          backdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : undefined,
          WebkitBackdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : undefined,
          opacity: cardOpacity,
        }}
      />
      <div
        className="relative z-10 flex items-start justify-center p-1.5 px-2"
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
                    'rounded-md object-cover',
                    item.thumbnail ? 'h-full w-full' : '',
                  )}
                  style={item.thumbnail ? undefined : { width: FAVICON_SIZE[gridSize], height: FAVICON_SIZE[gridSize] }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-4xl">{icon}</span>
        )}
      </div>

      {color && (
        <div
          className="relative z-10 mx-auto h-0.5 w-8 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className="relative z-10 flex flex-col items-center px-2 py-1.5"
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

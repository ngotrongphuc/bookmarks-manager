import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type BookmarkCardProps = {
  title: string
  url: string
  thumbnail: string | null
  cardStyle: Settings['cardStyle']
  cardOpacity: number
  gridSize: Settings['gridSize']
  accentColor?: string
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

/** Individual bookmark tile with thumbnail and title */
export function BookmarkCard({
  title, url, thumbnail, cardStyle, cardOpacity, gridSize,
  accentColor, onContextMenu, className,
}: BookmarkCardProps) {
  const size = GRID_SIZE_MAP[gridSize]
  const domain = getDomain(url)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  const imgSrc = thumbnail ?? faviconUrl

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
    backgroundColor: accentColor ?? (cardStyle === 'glass' ? 'rgba(255,255,255,0.1)' : 'rgb(30,41,59)'),
  }

  return (
    <div data-bookmark-card className={cardClasses} style={bgStyle} onContextMenu={onContextMenu}>
      <a href={url} className="flex flex-col" rel="noopener noreferrer">
        <div
          className="flex items-center justify-center overflow-hidden bg-black/20"
          style={{ width: size.width, height: size.height }}
        >
          <img
            src={imgSrc}
            alt={title}
            className={cn('object-cover', thumbnail ? 'h-full w-full' : 'h-8 w-8')}
            loading="lazy"
          />
        </div>
        <div
          className="truncate px-2 py-1.5 text-center text-white"
          style={{ fontSize: size.fontSize, width: size.width }}
        >
          {title}
        </div>
      </a>
    </div>
  )
}

function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

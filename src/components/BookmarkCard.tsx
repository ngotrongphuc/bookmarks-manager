import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type BookmarkCardProps = {
  title: string
  url: string
  thumbnail: string | null
  cardStyle: Settings['cardStyle']
  gridSize: Settings['gridSize']
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

/** Individual bookmark tile — just thumbnail/favicon + title, no wrapper */
export function BookmarkCard({
  title,
  url,
  thumbnail,
  cardStyle,
  gridSize,
  onContextMenu,
  className,
}: BookmarkCardProps) {
  const size = GRID_SIZE_MAP[gridSize]
  const domain = getDomain(url)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  const imgSrc = thumbnail ?? faviconUrl

  return (
    <div
      data-bookmark-card
      className={cn(
        'flex flex-col items-center transition-all duration-200',
        'hover:-translate-y-1 cursor-pointer',
        className,
      )}
      onContextMenu={onContextMenu}
    >
      <a
        href={url}
        className="flex flex-col items-center"
        rel="noopener noreferrer"
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden',
            thumbnail ? 'shadow-md' : '',
            cardStyle === 'rounded' && 'rounded-xl',
            cardStyle === 'sharp' && 'rounded-none',
            cardStyle === 'glass' && 'rounded-xl',
          )}
          style={{ width: size.width, height: size.height }}
        >
          <img
            src={imgSrc}
            alt={title}
            className={cn(
              'object-cover',
              thumbnail ? 'h-full w-full' : 'h-10 w-10',
            )}
            loading="lazy"
          />
        </div>
        <span
          className="mt-1.5 w-full truncate text-center text-white/90"
          style={{ fontSize: size.fontSize, width: size.width, lineHeight: '1.4em', minHeight: '1.4em' }}
        >
          {title || '\u00A0'}
        </span>
      </a>
    </div>
  )
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export type ContextMenuItem = {
  label: string
  action: () => void
  danger?: boolean
  icon?: string
}

type ContextMenuProps = {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

/** Right-click context menu positioned at cursor */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-slate-800 py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose() }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
            item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-white/80 hover:bg-white/10',
          )}
        >
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )
}

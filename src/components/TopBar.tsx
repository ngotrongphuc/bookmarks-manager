import type { Settings } from '@/types'

const GRID_SIZE_LABELS = { small: 'S', medium: 'M', large: 'L' } as const

type TopBarProps = {
  gridSize: Settings['gridSize']
  onOpenSearch: () => void
  onCycleGridSize: () => void
  onOpenSettings: () => void
}

/** Top bar with search, grid toggle, and settings gear */
export function TopBar({ gridSize, onOpenSearch, onCycleGridSize, onOpenSettings }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button aria-label="Search" onClick={onOpenSearch}
        className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <button aria-label="Grid size" onClick={onCycleGridSize}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          {GRID_SIZE_LABELS[gridSize]}
        </button>
        <button aria-label="Settings" onClick={onOpenSettings}
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

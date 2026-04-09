import { cn } from '@/lib/cn'
import type { EnrichedFolder } from '@/types'

type FolderTabsProps = {
  folders: EnrichedFolder[]
  activeFolderId: string | null
  accentColor: string
  onSelectFolder: (id: string) => void
  onAddFolder: () => void
  onContextMenu: (e: React.MouseEvent, folderId: string) => void
  onReorder: (orderedIds: string[]) => void
}

/** Horizontal scrollable folder tab bar */
export function FolderTabs({ folders, activeFolderId, accentColor, onSelectFolder, onAddFolder, onContextMenu }: FolderTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
      {folders.map((folder) => {
        const isActive = folder.chromeId === activeFolderId
        return (
          <button key={folder.chromeId} onClick={() => onSelectFolder(folder.chromeId)}
            onContextMenu={(e) => onContextMenu(e, folder.chromeId)}
            className={cn('flex-shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              isActive ? 'border-b-2 text-white' : 'text-white/60 hover:text-white/80')}
            style={isActive ? { borderColor: accentColor } : undefined}>
            {folder.icon ? `${folder.icon} ${folder.title}` : folder.title}
          </button>
        )
      })}
      <button onClick={onAddFolder} className="flex-shrink-0 rounded-lg px-3 py-2 text-sm text-white/40 transition-colors hover:text-white/70">+</button>
    </div>
  )
}

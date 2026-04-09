import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookmarkCard } from './BookmarkCard'
import { FolderCard } from './FolderCard'
import { AddBookmarkCard } from './AddBookmarkCard'
import type { EnrichedBookmark, EnrichedFolder, Settings } from '@/types'

type GridItem =
  | { kind: 'folder'; data: EnrichedFolder }
  | { kind: 'bookmark'; data: EnrichedBookmark }

type BookmarkGridProps = {
  folders: EnrichedFolder[]
  bookmarks: EnrichedBookmark[]
  settings: Pick<Settings, 'cardBackdropColor' | 'cardBorderRadius' | 'cardBlur' | 'cardOpacity' | 'gridSize' | 'columns' | 'gap'>
  onReorder: (orderedIds: string[]) => void
  onAddBookmark: () => void
  onOpenFolder: (folderId: string) => void
  onBookmarkContextMenu: (e: React.MouseEvent, chromeId: string) => void
  onFolderContextMenu: (e: React.MouseEvent, folderId: string) => void
}

function SortableItem({
  item,
  settings,
  onOpenFolder,
  onBookmarkContextMenu,
  onFolderContextMenu,
}: {
  item: GridItem
  settings: BookmarkGridProps['settings']
  onOpenFolder: (id: string) => void
  onBookmarkContextMenu: (e: React.MouseEvent) => void
  onFolderContextMenu: (e: React.MouseEvent) => void
}) {
  const id = item.kind === 'folder' ? item.data.chromeId : item.data.chromeId
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  if (item.kind === 'folder') {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <FolderCard
          title={item.data.title}
          icon={item.data.icon}
          color={item.data.color}
          bookmarkCount={item.data.bookmarkCount}
          previewItems={item.data.previewItems}
          cardBackdropColor={settings.cardBackdropColor}
          cardBorderRadius={settings.cardBorderRadius}
          cardBlur={settings.cardBlur}
          cardOpacity={settings.cardOpacity}
          gridSize={settings.gridSize}
          onClick={() => onOpenFolder(item.data.chromeId)}
          onContextMenu={onFolderContextMenu}
        />
      </div>
    )
  }

  const bm = item.data
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkCard
        title={bm.customTitle ?? bm.title}
        url={bm.url}
        thumbnail={bm.thumbnail}
        cardBorderRadius={settings.cardBorderRadius}
        gridSize={settings.gridSize}
        onContextMenu={onBookmarkContextMenu}
      />
    </div>
  )
}

/** Grid showing folders first, then bookmarks, with drag-and-drop */
export function BookmarkGrid({
  folders,
  bookmarks,
  settings,
  onReorder,
  onAddBookmark,
  onOpenFolder,
  onBookmarkContextMenu,
  onFolderContextMenu,
}: BookmarkGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Folders first, then bookmarks
  const items: GridItem[] = [
    ...folders.map((f) => ({ kind: 'folder' as const, data: f })),
    ...bookmarks.map((b) => ({ kind: 'bookmark' as const, data: b })),
  ]

  const allIds = items.map((item) => item.data.chromeId)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Only reorder bookmarks among themselves for now
    const oldIndex = bookmarks.findIndex((b) => b.chromeId === active.id)
    const newIndex = bookmarks.findIndex((b) => b.chromeId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...bookmarks]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved!)
    onReorder(reordered.map((b) => b.chromeId))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allIds} strategy={rectSortingStrategy}>
        <div
          className="grid justify-center p-4"
          style={{
            gridTemplateColumns: `repeat(${settings.columns}, max-content)`,
            gap: `${settings.gap}px`,
          }}
        >
          {items.map((item) => (
            <SortableItem
              key={item.data.chromeId}
              item={item}
              settings={settings}
              onOpenFolder={onOpenFolder}
              onBookmarkContextMenu={(e) =>
                item.kind === 'bookmark'
                  ? onBookmarkContextMenu(e, item.data.chromeId)
                  : undefined
              }
              onFolderContextMenu={(e) =>
                item.kind === 'folder'
                  ? onFolderContextMenu(e, item.data.chromeId)
                  : undefined
              }
            />
          ))}
          <AddBookmarkCard gridSize={settings.gridSize} onClick={onAddBookmark} />
        </div>
      </SortableContext>
    </DndContext>
  )
}

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookmarkCard } from './BookmarkCard'
import { AddBookmarkCard } from './AddBookmarkCard'
import type { EnrichedBookmark, Settings } from '@/types'

type BookmarkGridProps = {
  bookmarks: EnrichedBookmark[]
  settings: Pick<Settings, 'cardStyle' | 'cardOpacity' | 'gridSize' | 'columns'>
  onReorder: (orderedIds: string[]) => void
  onAddBookmark: () => void
  onContextMenu: (e: React.MouseEvent, chromeId: string) => void
}

function SortableBookmarkCard({ bookmark, settings, onContextMenu }: {
  bookmark: EnrichedBookmark; settings: BookmarkGridProps['settings']; onContextMenu: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bookmark.chromeId })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkCard title={bookmark.customTitle ?? bookmark.title} url={bookmark.url}
        thumbnail={bookmark.thumbnail} cardStyle={settings.cardStyle} cardOpacity={settings.cardOpacity}
        gridSize={settings.gridSize} accentColor={bookmark.accentColor} onContextMenu={onContextMenu} />
    </div>
  )
}

/** Sortable grid of bookmark cards with drag-and-drop */
export function BookmarkGrid({ bookmarks, settings, onReorder, onAddBookmark, onContextMenu }: BookmarkGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = bookmarks.findIndex((b) => b.chromeId === active.id)
    const newIndex = bookmarks.findIndex((b) => b.chromeId === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...bookmarks]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved!)
    onReorder(reordered.map((b) => b.chromeId))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={bookmarks.map((b) => b.chromeId)} strategy={rectSortingStrategy}>
        <div className="grid justify-center gap-4 p-4"
          style={{ gridTemplateColumns: `repeat(${settings.columns}, max-content)` }}>
          {bookmarks.map((bookmark) => (
            <SortableBookmarkCard key={bookmark.chromeId} bookmark={bookmark} settings={settings}
              onContextMenu={(e) => onContextMenu(e, bookmark.chromeId)} />
          ))}
          <AddBookmarkCard gridSize={settings.gridSize} onClick={onAddBookmark} />
        </div>
      </SortableContext>
    </DndContext>
  )
}

import { useMemo } from 'react'
import { useBookmarkStore } from '@/stores/bookmark-store'
import type { BookmarkEntry, Folder } from '@/types'

/** Get bookmarks sorted by position */
export function useActiveBookmarks(): BookmarkEntry[] {
  const bookmarks = useBookmarkStore((s) => s.bookmarks)
  return useMemo(() => {
    return Object.values(bookmarks).sort((a, b) => a.position - b.position)
  }, [bookmarks])
}

/** Get all folders sorted by position */
export function useSortedFolders(): Folder[] {
  const folders = useBookmarkStore((s) => s.folders)
  return useMemo(
    () => Object.values(folders).sort((a, b) => a.position - b.position),
    [folders],
  )
}

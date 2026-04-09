import { create } from 'zustand'
import type { BookmarkEntry, Folder } from '@/types'
import { storageGet, storageSet } from '@/lib/chrome-storage'

type BookmarkState = {
  bookmarks: Record<string, BookmarkEntry>
  folders: Record<string, Folder>
  activeFolderId: string | null
  _initialized: boolean

  addBookmark: (entry: BookmarkEntry) => void
  removeBookmark: (chromeId: string) => void
  updateBookmark: (chromeId: string, changes: Partial<BookmarkEntry>) => void
  addFolder: (folder: Folder) => void
  removeFolder: (chromeId: string) => void
  updateFolder: (chromeId: string, changes: Partial<Folder>) => void
  setActiveFolderId: (id: string | null) => void
  reorderBookmarks: (orderedIds: string[]) => void
  reorderFolders: (orderedIds: string[]) => void
  loadBookmarks: () => Promise<void>
  persist: () => void
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: {},
  folders: {},
  activeFolderId: null,
  _initialized: false,

  addBookmark: (entry) => {
    set((s) => ({ bookmarks: { ...s.bookmarks, [entry.chromeId]: entry } }))
    get().persist()
  },

  removeBookmark: (chromeId) => {
    set((s) => {
      const { [chromeId]: _, ...rest } = s.bookmarks
      return { bookmarks: rest }
    })
    get().persist()
  },

  updateBookmark: (chromeId, changes) => {
    set((s) => {
      const existing = s.bookmarks[chromeId]
      if (!existing) return s
      return {
        bookmarks: { ...s.bookmarks, [chromeId]: { ...existing, ...changes } },
      }
    })
    get().persist()
  },

  addFolder: (folder) => {
    set((s) => ({ folders: { ...s.folders, [folder.chromeId]: folder } }))
    get().persist()
  },

  removeFolder: (chromeId) => {
    set((s) => {
      const { [chromeId]: _, ...rest } = s.folders
      return { folders: rest }
    })
    get().persist()
  },

  updateFolder: (chromeId, changes) => {
    set((s) => {
      const existing = s.folders[chromeId]
      if (!existing) return s
      return {
        folders: { ...s.folders, [chromeId]: { ...existing, ...changes } },
      }
    })
    get().persist()
  },

  setActiveFolderId: (id) => {
    set({ activeFolderId: id })
    storageSet('activeFolderId', id)
  },

  reorderBookmarks: (orderedIds) => {
    set((s) => {
      const updated = { ...s.bookmarks }
      orderedIds.forEach((id, index) => {
        const entry = updated[id]
        if (entry) {
          updated[id] = { ...entry, position: index }
        }
      })
      return { bookmarks: updated }
    })
    get().persist()
  },

  reorderFolders: (orderedIds) => {
    set((s) => {
      const updated = { ...s.folders }
      orderedIds.forEach((id, index) => {
        const folder = updated[id]
        if (folder) {
          updated[id] = { ...folder, position: index }
        }
      })
      return { folders: updated }
    })
    get().persist()
  },

  loadBookmarks: async () => {
    const [bookmarks, folders, activeFolderId] = await Promise.all([
      storageGet<Record<string, BookmarkEntry>>('bookmarkEntries', {}),
      storageGet<Record<string, Folder>>('folderEntries', {}),
      storageGet<string | null>('activeFolderId', null),
    ])
    set({ bookmarks, folders, activeFolderId, _initialized: true })
  },

  persist: () => {
    const { bookmarks, folders } = get()
    storageSet('bookmarkEntries', bookmarks)
    storageSet('folderEntries', folders)
  },
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBookmarkStore } from './bookmark-store'
import type { BookmarkEntry, Folder } from '@/types'

describe('bookmark-store', () => {
  beforeEach(() => {
    useBookmarkStore.setState({
      bookmarks: {},
      folders: {},
      activeFolderId: null,
      _initialized: false,
    })
    vi.mocked(chrome.storage.local.get).mockReset()
    vi.mocked(chrome.storage.local.set).mockReset()
  })

  it('addBookmark adds entry to store', () => {
    const entry: BookmarkEntry = { chromeId: '10', position: 0, thumbnail: null }
    useBookmarkStore.getState().addBookmark(entry)
    expect(useBookmarkStore.getState().bookmarks['10']).toEqual(entry)
  })

  it('removeBookmark removes entry from store', () => {
    useBookmarkStore.setState({
      bookmarks: { '10': { chromeId: '10', position: 0, thumbnail: null } },
    })
    useBookmarkStore.getState().removeBookmark('10')
    expect(useBookmarkStore.getState().bookmarks['10']).toBeUndefined()
  })

  it('updateBookmark merges changes', () => {
    useBookmarkStore.setState({
      bookmarks: { '10': { chromeId: '10', position: 0, thumbnail: null } },
    })
    useBookmarkStore.getState().updateBookmark('10', { thumbnail: 'data:image/jpeg;base64,abc' })
    expect(useBookmarkStore.getState().bookmarks['10']?.thumbnail).toBe('data:image/jpeg;base64,abc')
    expect(useBookmarkStore.getState().bookmarks['10']?.position).toBe(0)
  })

  it('addFolder adds folder to store', () => {
    const folder: Folder = { chromeId: '20', position: 0, icon: '📁' }
    useBookmarkStore.getState().addFolder(folder)
    expect(useBookmarkStore.getState().folders['20']).toEqual(folder)
  })

  it('setActiveFolderId updates active folder', () => {
    useBookmarkStore.getState().setActiveFolderId('20')
    expect(useBookmarkStore.getState().activeFolderId).toBe('20')
  })

  it('reorderBookmarks updates positions', () => {
    useBookmarkStore.setState({
      bookmarks: {
        'a': { chromeId: 'a', position: 0, thumbnail: null },
        'b': { chromeId: 'b', position: 1, thumbnail: null },
        'c': { chromeId: 'c', position: 2, thumbnail: null },
      },
    })
    useBookmarkStore.getState().reorderBookmarks(['c', 'a', 'b'])
    const bm = useBookmarkStore.getState().bookmarks
    expect(bm['c']?.position).toBe(0)
    expect(bm['a']?.position).toBe(1)
    expect(bm['b']?.position).toBe(2)
  })
})

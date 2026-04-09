import { useEffect, useState, useCallback, useMemo } from 'react'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { TopBar } from '@/components/TopBar'
import { FolderTabs } from '@/components/FolderTabs'
import { BookmarkGrid } from '@/components/BookmarkGrid'
import { CommandPalette } from '@/components/CommandPalette'
import { SettingsPanel } from '@/components/SettingsPanel'
import { BookmarkModal } from '@/components/BookmarkModal'
import { FolderModal } from '@/components/FolderModal'
import { ContextMenu, type ContextMenuItem } from '@/components/ContextMenu'
import { Toast } from '@/components/Toast'
import { useSettingsStore } from '@/stores/settings-store'
import { useBookmarkStore } from '@/stores/bookmark-store'
import { useCommandPalette } from '@/hooks/use-command-palette'
import { useContextMenu } from '@/hooks/use-context-menu'
import {
  getBookmarksBar,
  getBookmarksBarChildren,
  createBookmark,
  createFolder as createChromeFolder,
  updateBookmark as updateChromeBookmark,
  removeBookmark as removeChromeBookmark,
  isFolder,
} from '@/lib/chrome-bookmarks'
import { requestThumbnailCapture } from '@/lib/thumbnail'
import { storageGet, storageSet } from '@/lib/chrome-storage'
import type { EnrichedBookmark, EnrichedFolder, Settings } from '@/types'

type ModalState =
  | { type: 'none' }
  | { type: 'add-bookmark' }
  | { type: 'edit-bookmark'; chromeId: string; title: string; url: string; thumbnail: string | null }
  | { type: 'add-folder' }
  | { type: 'edit-folder'; chromeId: string; name: string; icon: string; color: string }

export function App() {
  const settings = useSettingsStore()
  const bookmarkStore = useBookmarkStore()
  const commandPalette = useCommandPalette()
  const contextMenu = useContextMenu()
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chromeNodes, setChromeNodes] = useState<chrome.bookmarks.BookmarkTreeNode[]>([])
  const [bookmarksBarId, setBookmarksBarId] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)

  // Initialize on mount
  useEffect(() => {
    async function init() {
      await settings.loadSettings()
      await bookmarkStore.loadBookmarks()

      const bar = await getBookmarksBar()
      const children = bar?.children ?? []
      const barId = bar?.id ?? '1'
      setChromeNodes(children)
      setBookmarksBarId(barId)

      // Register the Bookmarks Bar folder if not already registered
      if (!bookmarkStore.folders[barId]) {
        bookmarkStore.addFolder({
          chromeId: barId,
          position: -1,
          icon: '⭐',
        })
      }

      // First-run: import bookmark/folder metadata
      const initialized = await storageGet<boolean>('initialized', false)
      if (!initialized) {
        await importBookmarks(children, barId)
        await storageSet('initialized', true)
        setShowWelcome(true)
      }

      // Always default to Bookmarks Bar
      bookmarkStore.setActiveFolderId(barId)
    }
    init()
  }, [])

  async function importBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[], barId: string) {
    let folderPos = 0
    let bookmarkPos = 0
    for (const node of nodes) {
      if (isFolder(node)) {
        bookmarkStore.addFolder({
          chromeId: node.id,
          position: folderPos++,
          icon: '📁',
        })
        if (node.children) {
          let innerPos = 0
          for (const child of node.children) {
            if (!isFolder(child) && child.url) {
              bookmarkStore.addBookmark({
                chromeId: child.id,
                position: innerPos++,
                thumbnail: null,
              })
            }
          }
        }
      } else if (node.url) {
        // Top-level bookmarks in Bookmarks Bar (parentId is the bar itself)
        bookmarkStore.addBookmark({
          chromeId: node.id,
          position: bookmarkPos++,
          thumbnail: null,
        })
      }
    }
  }

  // Derive enriched data from Chrome nodes + custom metadata
  const enrichedFolders: EnrichedFolder[] = useMemo(() => {
    const folders: EnrichedFolder[] = []

    // Always include the Bookmarks Bar itself as the first folder tab
    if (bookmarksBarId) {
      const barCustom = bookmarkStore.folders[bookmarksBarId]
      const looseBookmarkCount = chromeNodes.filter((n) => !isFolder(n)).length
      folders.push({
        chromeId: bookmarksBarId,
        title: 'Bookmarks Bar',
        position: barCustom?.position ?? -1,
        icon: barCustom?.icon ?? '⭐',
        color: barCustom?.color,
        bookmarkCount: looseBookmarkCount,
      })
    }

    // Add subfolders
    for (const node of chromeNodes) {
      if (isFolder(node)) {
        const custom = bookmarkStore.folders[node.id]
        folders.push({
          chromeId: node.id,
          title: node.title,
          position: custom?.position ?? 0,
          icon: custom?.icon,
          color: custom?.color,
          bookmarkCount: node.children?.filter((c) => !isFolder(c)).length ?? 0,
        })
      }
    }

    return folders.sort((a, b) => a.position - b.position)
  }, [chromeNodes, bookmarkStore.folders, bookmarksBarId])

  const allEnrichedBookmarks: EnrichedBookmark[] = useMemo(() => {
    const result: EnrichedBookmark[] = []
    function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
      for (const node of nodes) {
        if (isFolder(node) && node.children) {
          traverse(node.children)
        } else if (node.url) {
          const custom = bookmarkStore.bookmarks[node.id]
          result.push({
            chromeId: node.id,
            title: custom?.customTitle ?? node.title,
            url: node.url,
            position: custom?.position ?? 0,
            thumbnail: custom?.thumbnail ?? null,
            customTitle: custom?.customTitle,
            accentColor: custom?.accentColor,
            parentId: node.parentId ?? '',
          })
        }
      }
    }
    traverse(chromeNodes)
    return result
  }, [chromeNodes, bookmarkStore.bookmarks])

  const activeBookmarks = useMemo(() => {
    return allEnrichedBookmarks
      .filter((b) => b.parentId === bookmarkStore.activeFolderId)
      .sort((a, b) => a.position - b.position)
  }, [allEnrichedBookmarks, bookmarkStore.activeFolderId])

  const cycleGridSize = useCallback(() => {
    const order: Settings['gridSize'][] = ['small', 'medium', 'large']
    const current = order.indexOf(settings.gridSize)
    const next = order[(current + 1) % order.length]!
    settings.updateSettings({ gridSize: next })
  }, [settings.gridSize])

  async function handleAddBookmark(data: { title: string; url: string; folderId: string; thumbnail: string | null }) {
    const created = await createBookmark(data.title, data.url, data.folderId)
    bookmarkStore.addBookmark({ chromeId: created.id, position: activeBookmarks.length, thumbnail: data.thumbnail })
    setChromeNodes(await getBookmarksBarChildren())
    setModal({ type: 'none' })
  }

  async function handleEditBookmark(chromeId: string, data: { title: string; url: string; folderId: string; thumbnail: string | null }) {
    await updateChromeBookmark(chromeId, { title: data.title, url: data.url })
    bookmarkStore.updateBookmark(chromeId, { thumbnail: data.thumbnail, customTitle: data.title })
    const children = await getBookmarksBarChildren()
    setChromeNodes(children)
    setModal({ type: 'none' })
  }

  async function handleDeleteBookmark(chromeId: string) {
    await removeChromeBookmark(chromeId)
    bookmarkStore.removeBookmark(chromeId)
    const children = await getBookmarksBarChildren()
    setChromeNodes(children)
  }

  async function handleAddFolder(data: { name: string; icon: string; color: string }) {
    const created = await createChromeFolder(data.name, bookmarksBarId ?? '1')
    bookmarkStore.addFolder({ chromeId: created.id, position: enrichedFolders.length, icon: data.icon, color: data.color })
    bookmarkStore.setActiveFolderId(created.id)
    const children = await getBookmarksBarChildren()
    setChromeNodes(children)
    setModal({ type: 'none' })
  }

  function showBookmarkContextMenu(e: React.MouseEvent, chromeId: string) {
    const bookmark = allEnrichedBookmarks.find((b) => b.chromeId === chromeId)
    if (!bookmark) return
    const items: ContextMenuItem[] = [
      { label: 'Open in new tab', icon: '↗', action: () => window.open(bookmark.url, '_blank') },
      { label: 'Edit', icon: '✏️', action: () => setModal({ type: 'edit-bookmark', chromeId, title: bookmark.title, url: bookmark.url, thumbnail: bookmark.thumbnail }) },
      { label: 'Capture thumbnail', icon: '📸', action: async () => { const thumb = await requestThumbnailCapture(bookmark.url); if (thumb) bookmarkStore.updateBookmark(chromeId, { thumbnail: thumb }) } },
      { label: 'Delete', icon: '🗑️', danger: true, action: () => handleDeleteBookmark(chromeId) },
    ]
    contextMenu.show(e, items)
  }

  function showFolderContextMenu(e: React.MouseEvent, folderId: string) {
    const folder = enrichedFolders.find((f) => f.chromeId === folderId)
    if (!folder) return
    const items: ContextMenuItem[] = [
      { label: 'Edit', icon: '✏️', action: () => setModal({ type: 'edit-folder', chromeId: folderId, name: folder.title, icon: folder.icon ?? '📁', color: folder.color ?? '#3b82f6' }) },
      { label: 'Delete', icon: '🗑️', danger: true, action: async () => {
        await removeChromeBookmark(folderId)
        bookmarkStore.removeFolder(folderId)
        const children = await getBookmarksBarChildren()
        setChromeNodes(children)
        if (bookmarkStore.activeFolderId === folderId) {
          const first = children.find(isFolder)
          bookmarkStore.setActiveFolderId(first?.id ?? null)
        }
      }},
    ]
    contextMenu.show(e, items)
  }

  const fontStyle = { fontFamily: settings.fontFamily }

  return (
    <div className="min-h-screen" style={fontStyle}>
      <BackgroundLayer background={settings.background} />
      <div className="relative z-10">
        <TopBar gridSize={settings.gridSize} onOpenSearch={commandPalette.open} onCycleGridSize={cycleGridSize} onOpenSettings={() => setSettingsOpen(true)} />
        <FolderTabs folders={enrichedFolders} activeFolderId={bookmarkStore.activeFolderId} accentColor={settings.accentColor}
          onSelectFolder={(id) => bookmarkStore.setActiveFolderId(id)} onAddFolder={() => setModal({ type: 'add-folder' })}
          onContextMenu={showFolderContextMenu} onReorder={(ids) => bookmarkStore.reorderFolders(ids)} />
        <BookmarkGrid bookmarks={activeBookmarks} settings={settings} onReorder={(ids) => bookmarkStore.reorderBookmarks(ids)}
          onAddBookmark={() => setModal({ type: 'add-bookmark' })} onContextMenu={showBookmarkContextMenu} />
      </div>

      {commandPalette.isOpen && (
        <CommandPalette bookmarks={allEnrichedBookmarks} onClose={commandPalette.close}
          onEdit={(id) => { commandPalette.close(); const bm = allEnrichedBookmarks.find((b) => b.chromeId === id); if (bm) setModal({ type: 'edit-bookmark', chromeId: id, title: bm.title, url: bm.url, thumbnail: bm.thumbnail }) }}
          onDelete={(id) => { commandPalette.close(); handleDeleteBookmark(id) }} />
      )}

      {settingsOpen && <SettingsPanel settings={settings} onUpdate={settings.updateSettings} onClose={() => setSettingsOpen(false)} />}

      {modal.type === 'add-bookmark' && (
        <BookmarkModal mode="add" folders={enrichedFolders.map((f) => ({ chromeId: f.chromeId, title: f.title }))}
          currentFolderId={bookmarkStore.activeFolderId ?? ''} onSave={handleAddBookmark} onClose={() => setModal({ type: 'none' })}
          onCaptureThumbnail={requestThumbnailCapture} />
      )}
      {modal.type === 'edit-bookmark' && (
        <BookmarkModal mode="edit" folders={enrichedFolders.map((f) => ({ chromeId: f.chromeId, title: f.title }))}
          currentFolderId={bookmarkStore.activeFolderId ?? ''} initialTitle={modal.title} initialUrl={modal.url} initialThumbnail={modal.thumbnail}
          onSave={(data) => handleEditBookmark(modal.chromeId, data)} onClose={() => setModal({ type: 'none' })}
          onCaptureThumbnail={requestThumbnailCapture} />
      )}
      {modal.type === 'add-folder' && (
        <FolderModal mode="add" onSave={handleAddFolder} onClose={() => setModal({ type: 'none' })} />
      )}
      {modal.type === 'edit-folder' && (
        <FolderModal mode="edit" initialName={modal.name} initialIcon={modal.icon} initialColor={modal.color}
          onSave={async (data) => {
            await updateChromeBookmark(modal.chromeId, { title: data.name })
            bookmarkStore.updateFolder(modal.chromeId, { icon: data.icon, color: data.color })
            const children = await getBookmarksBarChildren()
            setChromeNodes(children)
            setModal({ type: 'none' })
          }}
          onClose={() => setModal({ type: 'none' })} />
      )}

      {contextMenu.menu.visible && <ContextMenu x={contextMenu.menu.x} y={contextMenu.menu.y} items={contextMenu.menu.items} onClose={contextMenu.hide} />}
      {showWelcome && <Toast message="Welcome! Press Ctrl+K to search, drag to reorder, right-click for options." duration={8000} />}
    </div>
  )
}

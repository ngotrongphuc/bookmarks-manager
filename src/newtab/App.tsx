import { useEffect, useState, useCallback, useMemo } from 'react'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { TopBar } from '@/components/TopBar'
import { Breadcrumb } from '@/components/Breadcrumb'
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

/** Find a node by ID anywhere in the tree */
function findNode(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  id: string,
): chrome.bookmarks.BookmarkTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Build breadcrumb path from root to a given node ID */
function buildPath(
  root: chrome.bookmarks.BookmarkTreeNode,
  targetId: string,
): Array<{ id: string; title: string; icon?: string }> {
  const result: Array<{ id: string; title: string }> = []

  function walk(node: chrome.bookmarks.BookmarkTreeNode): boolean {
    if (node.id === targetId) {
      result.push({ id: node.id, title: node.title || 'Bookmarks Bar' })
      return true
    }
    if (node.children) {
      for (const child of node.children) {
        if (walk(child)) {
          result.push({ id: node.id, title: node.title || 'Bookmarks Bar' })
          return true
        }
      }
    }
    return false
  }

  walk(root)
  return result.reverse()
}

export function App() {
  const settings = useSettingsStore()
  const bookmarkStore = useBookmarkStore()
  const commandPalette = useCommandPalette()
  const contextMenu = useContextMenu()
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // The full Bookmarks Bar node (with all children/nested)
  const [barNode, setBarNode] = useState<chrome.bookmarks.BookmarkTreeNode | null>(null)

  // Current folder being viewed (drill-down navigation)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  // Reload the bookmarks bar tree from Chrome
  const reloadTree = useCallback(async () => {
    const bar = await getBookmarksBar()
    if (bar) setBarNode(bar)
    return bar
  }, [])

  // Listen for external bookmark changes (Ctrl+D, bookmark bar, other extensions)
  useEffect(() => {
    function handleExternalChange() {
      reloadTree()
    }

    chrome.bookmarks.onCreated.addListener(handleExternalChange)
    chrome.bookmarks.onRemoved.addListener(handleExternalChange)
    chrome.bookmarks.onChanged.addListener(handleExternalChange)
    chrome.bookmarks.onMoved.addListener(handleExternalChange)

    return () => {
      chrome.bookmarks.onCreated.removeListener(handleExternalChange)
      chrome.bookmarks.onRemoved.removeListener(handleExternalChange)
      chrome.bookmarks.onChanged.removeListener(handleExternalChange)
      chrome.bookmarks.onMoved.removeListener(handleExternalChange)
    }
  }, [reloadTree])

  // Initialize on mount
  useEffect(() => {
    async function init() {
      await settings.loadSettings()
      await bookmarkStore.loadBookmarks()

      const bar = await reloadTree()
      const barId = bar?.id ?? '1'

      // First-run: register bar folder + import metadata
      const initialized = await storageGet<boolean>('initialized', false)
      if (!initialized) {
        bookmarkStore.addFolder({
          chromeId: barId,
          position: -1,
          icon: '⭐',
        })
        if (bar?.children) {
          importFolders(bar.children)
        }
        // Set default background based on system theme
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        settings.updateSettings({
          background: {
            type: 'color',
            value: isDark ? '#323639' : '#f1f5f9',
          },
        })
        await storageSet('initialized', true)
        setShowWelcome(true)
      }

      // Start at the Bookmarks Bar root
      setCurrentFolderId(barId)
    }
    init()
  }, [])

  /** Import folder metadata recursively */
  function importFolders(nodes: chrome.bookmarks.BookmarkTreeNode[], posStart = 0) {
    let pos = posStart
    for (const node of nodes) {
      if (isFolder(node)) {
        bookmarkStore.addFolder({
          chromeId: node.id,
          position: pos++,
          icon: '📁',
        })
        if (node.children) {
          importFolders(node.children)
        }
      } else if (node.url) {
        bookmarkStore.addBookmark({
          chromeId: node.id,
          position: pos++,
          thumbnail: null,
        })
      }
    }
  }

  // Current folder's direct children (folders + bookmarks at this level)
  const currentNode = useMemo(() => {
    if (!barNode || !currentFolderId) return null
    if (barNode.id === currentFolderId) return barNode
    return findNode(barNode.children ?? [], currentFolderId)
  }, [barNode, currentFolderId])

  const currentChildren = currentNode?.children ?? []

  // Split into folders and bookmarks at this level
  const currentFolders: EnrichedFolder[] = useMemo(() => {
    return currentChildren
      .filter(isFolder)
      .map((node) => {
        const custom = bookmarkStore.folders[node.id]
        // Collect first 4 bookmark children for the preview grid
        const previewItems = (node.children ?? [])
          .filter((c) => c.url)
          .slice(0, 4)
          .map((c) => {
            const bmCustom = bookmarkStore.bookmarks[c.id]
            return {
              title: c.title,
              url: c.url!,
              thumbnail: bmCustom?.thumbnail ?? null,
            }
          })
        return {
          chromeId: node.id,
          title: node.title,
          position: custom?.position ?? 0,
          icon: custom?.icon,
          color: custom?.color,
          bookmarkCount: node.children?.length ?? 0,
          previewItems,
        }
      })
      .sort((a, b) => a.position - b.position)
  }, [currentChildren, bookmarkStore.folders, bookmarkStore.bookmarks])

  const currentBookmarks: EnrichedBookmark[] = useMemo(() => {
    return currentChildren
      .filter((n) => !isFolder(n) && n.url)
      .map((node) => {
        const custom = bookmarkStore.bookmarks[node.id]
        return {
          chromeId: node.id,
          title: custom?.customTitle ?? node.title,
          url: node.url!,
          position: custom?.position ?? 0,
          thumbnail: custom?.thumbnail ?? null,
          customTitle: custom?.customTitle,
          accentColor: custom?.accentColor,
          parentId: node.parentId ?? '',
        }
      })
      .sort((a, b) => a.position - b.position)
  }, [currentChildren, bookmarkStore.bookmarks])

  // ALL bookmarks across the entire tree (for CommandPalette search)
  const allBookmarks: EnrichedBookmark[] = useMemo(() => {
    if (!barNode) return []
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
    traverse(barNode.children ?? [])
    return result
  }, [barNode, bookmarkStore.bookmarks])

  // All folders for the BookmarkModal folder selector
  const allFolders: Array<{ chromeId: string; title: string }> = useMemo(() => {
    if (!barNode) return []
    const result: Array<{ chromeId: string; title: string }> = [
      { chromeId: barNode.id, title: 'Bookmarks Bar' },
    ]
    function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[], prefix = '') {
      for (const node of nodes) {
        if (isFolder(node)) {
          const label = prefix ? `${prefix} / ${node.title}` : node.title
          result.push({ chromeId: node.id, title: label })
          if (node.children) traverse(node.children, label)
        }
      }
    }
    traverse(barNode.children ?? [])
    return result
  }, [barNode])

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!barNode || !currentFolderId) return []
    return buildPath(barNode, currentFolderId).map((item) => {
      const custom = bookmarkStore.folders[item.id]
      return { ...item, icon: custom?.icon }
    })
  }, [barNode, currentFolderId, bookmarkStore.folders])


  // Navigation
  function openFolder(folderId: string) {
    setCurrentFolderId(folderId)
  }

  // CRUD handlers
  async function handleAddBookmark(data: {
    title: string
    url: string
    folderId: string
    thumbnail: string | null
  }) {
    const created = await createBookmark(data.title, data.url, data.folderId)
    bookmarkStore.addBookmark({
      chromeId: created.id,
      position: currentBookmarks.length,
      thumbnail: data.thumbnail,
    })
    await reloadTree()
    setModal({ type: 'none' })
  }

  async function handleEditBookmark(
    chromeId: string,
    data: { title: string; url: string; folderId: string; thumbnail: string | null },
  ) {
    await updateChromeBookmark(chromeId, { title: data.title, url: data.url })
    bookmarkStore.updateBookmark(chromeId, {
      thumbnail: data.thumbnail,
      customTitle: data.title,
    })
    await reloadTree()
    setModal({ type: 'none' })
  }

  async function handleDeleteBookmark(chromeId: string) {
    await removeChromeBookmark(chromeId)
    bookmarkStore.removeBookmark(chromeId)
    await reloadTree()
  }

  async function handleAddFolder(data: { name: string; icon: string; color: string }) {
    const parentId = currentFolderId ?? barNode?.id ?? '1'
    const created = await createChromeFolder(data.name, parentId)
    bookmarkStore.addFolder({
      chromeId: created.id,
      position: currentFolders.length,
      icon: data.icon,
      color: data.color,
    })
    await reloadTree()
    setModal({ type: 'none' })
  }

  // Context menus
  function showBookmarkContextMenu(e: React.MouseEvent, chromeId: string) {
    const bookmark = allBookmarks.find((b) => b.chromeId === chromeId)
    if (!bookmark) return
    const items: ContextMenuItem[] = [
      {
        label: 'Open in new tab',
        icon: '↗',
        action: () => window.open(bookmark.url, '_blank'),
      },
      {
        label: 'Edit',
        icon: '✏️',
        action: () =>
          setModal({
            type: 'edit-bookmark',
            chromeId,
            title: bookmark.title,
            url: bookmark.url,
            thumbnail: bookmark.thumbnail,
          }),
      },
      {
        label: 'Capture thumbnail',
        icon: '📸',
        action: async () => {
          const thumb = await requestThumbnailCapture(bookmark.url)
          if (thumb) bookmarkStore.updateBookmark(chromeId, { thumbnail: thumb })
        },
      },
      {
        label: 'Delete',
        icon: '🗑️',
        danger: true,
        action: () => handleDeleteBookmark(chromeId),
      },
    ]
    contextMenu.show(e, items)
  }

  function showFolderContextMenu(e: React.MouseEvent, folderId: string) {
    const folder = currentFolders.find((f) => f.chromeId === folderId)
    if (!folder) return
    const items: ContextMenuItem[] = [
      {
        label: 'Open',
        icon: '📂',
        action: () => openFolder(folderId),
      },
      {
        label: 'Edit',
        icon: '✏️',
        action: () =>
          setModal({
            type: 'edit-folder',
            chromeId: folderId,
            name: folder.title,
            icon: folder.icon ?? '📁',
            color: folder.color ?? '#3b82f6',
          }),
      },
      {
        label: 'Delete',
        icon: '🗑️',
        danger: true,
        action: async () => {
          await removeChromeBookmark(folderId)
          bookmarkStore.removeFolder(folderId)
          await reloadTree()
        },
      },
    ]
    contextMenu.show(e, items)
  }

  function showBackgroundContextMenu(e: React.MouseEvent) {
    // Only show if right-clicking on the page background, not on a card
    const target = e.target as HTMLElement
    if (target.closest('[data-bookmark-card]') || target.closest('[data-folder-card]')) return

    const items: ContextMenuItem[] = [
      {
        label: 'Add bookmark',
        icon: '🔗',
        action: () => setModal({ type: 'add-bookmark' }),
      },
      {
        label: 'Add folder',
        icon: '📁',
        action: () => setModal({ type: 'add-folder' }),
      },
    ]
    contextMenu.show(e, items)
  }

  const fontStyle = { fontFamily: settings.fontFamily }

  return (
    <div className="min-h-screen" style={fontStyle} onContextMenu={showBackgroundContextMenu}>
      <BackgroundLayer background={settings.background} />

      <div className="relative z-10">
        <TopBar
          onOpenSearch={commandPalette.open}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <Breadcrumb path={breadcrumbPath} onNavigate={openFolder} />

        <BookmarkGrid
          folders={currentFolders}
          bookmarks={currentBookmarks}
          settings={settings}
          onReorder={(ids) => bookmarkStore.reorderBookmarks(ids)}
          onAddBookmark={() => setModal({ type: 'add-bookmark' })}
          onOpenFolder={openFolder}
          onBookmarkContextMenu={showBookmarkContextMenu}
          onFolderContextMenu={showFolderContextMenu}
        />
      </div>

      {/* Command Palette */}
      {commandPalette.isOpen && (
        <CommandPalette
          bookmarks={allBookmarks}
          onClose={commandPalette.close}
          onEdit={(id) => {
            commandPalette.close()
            const bm = allBookmarks.find((b) => b.chromeId === id)
            if (bm)
              setModal({
                type: 'edit-bookmark',
                chromeId: id,
                title: bm.title,
                url: bm.url,
                thumbnail: bm.thumbnail,
              })
          }}
          onDelete={(id) => {
            commandPalette.close()
            handleDeleteBookmark(id)
          }}
        />
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdate={settings.updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Modals */}
      {modal.type === 'add-bookmark' && (
        <BookmarkModal
          mode="add"
          folders={allFolders}
          currentFolderId={currentFolderId ?? ''}
          onSave={handleAddBookmark}
          onClose={() => setModal({ type: 'none' })}
          onCaptureThumbnail={requestThumbnailCapture}
        />
      )}
      {modal.type === 'edit-bookmark' && (
        <BookmarkModal
          mode="edit"
          folders={allFolders}
          currentFolderId={currentFolderId ?? ''}
          initialTitle={modal.title}
          initialUrl={modal.url}
          initialThumbnail={modal.thumbnail}
          onSave={(data) => handleEditBookmark(modal.chromeId, data)}
          onClose={() => setModal({ type: 'none' })}
          onCaptureThumbnail={requestThumbnailCapture}
        />
      )}
      {modal.type === 'add-folder' && (
        <FolderModal
          mode="add"
          onSave={handleAddFolder}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {modal.type === 'edit-folder' && (
        <FolderModal
          mode="edit"
          initialName={modal.name}
          initialIcon={modal.icon}
          initialColor={modal.color}
          onSave={async (data) => {
            await updateChromeBookmark(modal.chromeId, { title: data.name })
            bookmarkStore.updateFolder(modal.chromeId, {
              icon: data.icon,
              color: data.color,
            })
            await reloadTree()
            setModal({ type: 'none' })
          }}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {/* Context Menu */}
      {contextMenu.menu.visible && (
        <ContextMenu
          x={contextMenu.menu.x}
          y={contextMenu.menu.y}
          items={contextMenu.menu.items}
          onClose={contextMenu.hide}
        />
      )}

      {/* Welcome Toast */}
      {showWelcome && (
        <Toast
          message="Welcome! Press Ctrl+K to search, drag to reorder, right-click for options."
          duration={8000}
        />
      )}
    </div>
  )
}

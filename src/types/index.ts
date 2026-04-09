/** Custom metadata for a bookmark, stored in chrome.storage.local */
export type BookmarkEntry = {
  chromeId: string
  position: number
  thumbnail: string | null
  customTitle?: string
  accentColor?: string
}

/** Custom metadata for a folder, stored in chrome.storage.local */
export type Folder = {
  chromeId: string
  position: number
  icon?: string
  color?: string
}

/** App settings, stored in chrome.storage.local */
export type Settings = {
  background: {
    type: 'color' | 'gradient' | 'image'
    value: string
  }
  theme: 'light' | 'dark'
  accentColor: string
  cardStyle: 'rounded' | 'sharp' | 'glass'
  fontFamily: string
  cardOpacity: number
  gridSize: 'small' | 'medium' | 'large'
  columns: number
}

/** A Chrome bookmark node enriched with custom metadata */
export type EnrichedBookmark = {
  chromeId: string
  title: string
  url: string
  position: number
  thumbnail: string | null
  customTitle?: string
  accentColor?: string
  parentId: string
}

/** Preview item for folder card thumbnails */
export type FolderPreviewItem = {
  title: string
  url: string
  thumbnail: string | null
}

/** A Chrome folder enriched with custom metadata */
export type EnrichedFolder = {
  chromeId: string
  title: string
  position: number
  icon?: string
  color?: string
  bookmarkCount: number
  previewItems: FolderPreviewItem[]
}

/** Context menu action types */
export type ContextMenuAction =
  | { type: 'open-new-tab'; url: string }
  | { type: 'edit-bookmark'; chromeId: string }
  | { type: 'change-thumbnail'; chromeId: string }
  | { type: 'move-to-folder'; chromeId: string; folderId: string }
  | { type: 'delete-bookmark'; chromeId: string }
  | { type: 'edit-folder'; chromeId: string }
  | { type: 'delete-folder'; chromeId: string }

/** Message types between new tab page and background service worker */
export type BackgroundMessage =
  | { type: 'capture-thumbnail'; url: string }
  | { type: 'thumbnail-result'; data: string | null }

export const DEFAULT_SETTINGS: Settings = {
  background: { type: 'color', value: '#0f172a' },
  theme: 'dark',
  accentColor: '#3b82f6',
  cardStyle: 'rounded',
  fontFamily: 'Inter',
  cardOpacity: 0.9,
  gridSize: 'medium',
  columns: 4,
}

/** Grid size to pixel dimension mappings */
export const GRID_SIZE_MAP = {
  small: { width: 120, height: 90, fontSize: 12 },
  medium: { width: 180, height: 135, fontSize: 14 },
  large: { width: 240, height: 180, fontSize: 16 },
} as const

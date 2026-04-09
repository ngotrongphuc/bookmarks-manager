# Speed Dial Bookmarks — Chrome Extension Design Spec

## Overview

A Chrome extension that replaces the default new tab page with a visual speed dial bookmarks manager. Users can organize bookmarks into folders, drag-and-drop to reorder, search across all bookmarks via a command palette, generate/upload thumbnails, and fully customize the page appearance.

## Tech Stack

- **Framework:** React 19 + TypeScript (strict mode)
- **Build:** Vite + CRXJS Vite Plugin (Manifest V3)
- **Styling:** Tailwind CSS v4
- **State:** Zustand (persisted to Chrome Storage)
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **Package Manager:** yarn v4
- **Linting:** ESLint strict + Prettier (2 spaces, single quotes, no semicolons)
- **Testing:** Vitest

## Extension Manifest

- **Type:** Manifest V3
- **Permissions:** `bookmarks`, `storage`, `activeTab`, `tabs`
- **chrome_url_overrides:** `{ "newtab": "src/newtab/index.html" }`
- **Service worker:** `src/background/index.ts`

## Project Structure

```
speed-dial-bookmarks/
├── src/
│   ├── newtab/                # New tab React app entry
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   ├── background/            # Service worker
│   │   └── index.ts
│   ├── components/            # React components
│   │   ├── BackgroundLayer.tsx
│   │   ├── TopBar.tsx
│   │   ├── FolderTabs.tsx
│   │   ├── BookmarkGrid.tsx
│   │   ├── BookmarkCard.tsx
│   │   ├── AddBookmarkCard.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── BookmarkModal.tsx
│   │   ├── FolderModal.tsx
│   │   └── ContextMenu.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-bookmarks.ts
│   │   ├── use-settings.ts
│   │   ├── use-command-palette.ts
│   │   └── use-context-menu.ts
│   ├── stores/                # Zustand stores
│   │   ├── bookmark-store.ts
│   │   └── settings-store.ts
│   ├── lib/                   # Utilities
│   │   ├── chrome-bookmarks.ts
│   │   ├── chrome-storage.ts
│   │   ├── thumbnail.ts
│   │   └── cn.ts
│   └── types/                 # TypeScript types
│       └── index.ts
├── public/
│   └── icons/                 # Extension icons (16, 32, 48, 128)
├── manifest.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .prettierrc
└── .eslintrc.cjs
```

## Data Model

### BookmarkEntry (chrome.storage.local)

Custom metadata stored per bookmark, keyed by Chrome bookmark ID.

```ts
type BookmarkEntry = {
  chromeId: string          // Chrome Bookmarks API ID
  position: number          // Sort order within folder
  thumbnail: string | null  // Base64 data URL or external URL
  customTitle?: string      // Override for Chrome's native title
  accentColor?: string      // Per-bookmark accent color (hex)
}
```

### Folder (chrome.storage.local)

Custom metadata for folders.

```ts
type Folder = {
  chromeId: string          // Chrome Bookmarks API folder ID
  position: number          // Sort order among folders
  icon?: string             // Emoji or icon identifier
  color?: string            // Folder accent color (hex)
}
```

### Settings (chrome.storage.local)

```ts
type Settings = {
  background: {
    type: 'color' | 'gradient' | 'image'
    value: string           // Hex color, CSS gradient, or base64/URL
  }
  theme: 'light' | 'dark'
  accentColor: string       // Hex
  cardStyle: 'rounded' | 'sharp' | 'glass'
  fontFamily: string        // Google Font name or system font
  cardOpacity: number       // 0 to 1
  gridSize: 'small' | 'medium' | 'large'
  columns: number           // 3 to 8
}
```

### Storage Strategy

- **Chrome Bookmarks API** stores: title, URL, folder hierarchy (syncs across devices natively)
- **chrome.storage.local** stores: positions, thumbnails, visual settings, folder metadata (local only, 10MB limit)
- On extension reinstall, bookmarks survive via Chrome's native storage; custom metadata (thumbnails, positions, styles) is lost

## Page Layout

```
┌─────────────────────────────────────────────────┐
│  [🔍 Search]                    [Grid] [⚙ Gear] │  ← TopBar
├─────────────────────────────────────────────────┤
│  📁 Social  📁 Work  📁 Dev  📁 News   [+ Add] │  ← FolderTabs
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │thumb │  │thumb │  │thumb │  │thumb │       │
│  │      │  │      │  │      │  │      │       │
│  │ Title│  │ Title│  │ Title│  │ Title│       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │  ← BookmarkGrid
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌ ─ ─ ─┐       │
│  │thumb │  │thumb │  │thumb │  │  +   │       │
│  │      │  │      │  │      │  │ Add  │       │
│  │ Title│  │ Title│  │ Title│  │      │       │
│  └──────┘  └──────┘  └──────┘  └ ─ ─ ─┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Components

### BackgroundLayer
Renders the full-page background based on settings. Supports solid color, CSS gradient, or image (base64 or URL). Image backgrounds use `object-fit: cover` with optional overlay for readability.

### TopBar
Contains: search icon (opens CommandPalette), grid size cycle button (S/M/L), settings gear icon (opens SettingsPanel). Fixed at top, semi-transparent background with backdrop blur.

### FolderTabs
Horizontal scrollable row of folder tabs. Active folder is highlighted with the accent color. Each tab shows folder emoji + name. Draggable to reorder via @dnd-kit. "+" button at the end opens FolderModal. Right-click on a folder tab shows context menu (rename, change icon, delete).

### BookmarkGrid
CSS Grid container. Column count determined by settings. Wraps @dnd-kit DndContext and SortableContext for drag-and-drop reordering. Renders BookmarkCard for each bookmark in the active folder + AddBookmarkCard at the end.

### BookmarkCard
Displays: thumbnail (or favicon + color fallback), title below. Hover state shows subtle lift/shadow. Click opens the bookmark URL. Right-click opens ContextMenu. Draggable via @dnd-kit useSortable. Visual style adapts to settings (rounded/sharp/glass, opacity).

Grid size mappings:
- **Small:** 120x90px thumbnail, 12px title
- **Medium:** 180x135px thumbnail, 14px title
- **Large:** 240x180px thumbnail, 16px title

### AddBookmarkCard
Dashed border card with "+" icon. Same size as BookmarkCard. Click opens BookmarkModal in "add" mode.

### CommandPalette
Triggered by Ctrl+K (or Cmd+K on Mac) or clicking the search icon. Centered modal with:
- Search input at top, auto-focused
- Results list below, filtered by title and URL across ALL folders
- Each result shows: favicon, title, URL, folder path
- Keyboard navigation: arrow keys to move, Enter to open, Esc to close
- Secondary actions per result: Edit (pencil icon), Delete (trash icon), Move (folder icon)
- Fuzzy matching on title and URL

### SettingsPanel
Slides in from the right edge (300px wide). Contains sections:
- **Background:** Toggle between color picker, gradient builder (direction + 2 colors), image upload (drag-and-drop or file picker)
- **Theme:** Light/Dark toggle
- **Accent Color:** Color picker
- **Card Style:** Segmented control (Rounded / Sharp / Glass)
- **Font:** Dropdown with system fonts + popular Google Fonts
- **Card Opacity:** Slider 0-1
- **Grid Size:** Segmented control (S / M / L)
- **Columns:** Slider 3-8

All changes apply in real-time. Persisted to chrome.storage.local on change (debounced 300ms).

### BookmarkModal
Modal form for adding/editing a bookmark:
- Title input (pre-filled from page title on add)
- URL input
- Thumbnail section: auto-generated preview, "Upload" button, "Capture" button (triggers screenshot)
- Folder selector dropdown
- Save / Cancel buttons

### FolderModal
Modal form for adding/editing a folder:
- Name input
- Emoji picker for icon
- Color picker for accent
- Save / Cancel buttons

### ContextMenu
Custom right-click context menu positioned at cursor. Actions vary by target:
- **Bookmark:** Open in new tab, Edit, Change thumbnail, Move to folder (submenu), Delete
- **Folder tab:** Rename, Change icon/color, Delete (with confirmation if non-empty)

## Key Interactions

### Drag and Drop
- **Reorder bookmarks** within a folder by dragging cards
- **Move bookmark to folder** by dragging a card onto a folder tab
- **Reorder folders** by dragging folder tabs
- Uses @dnd-kit with DragOverlay for smooth visual feedback
- Position changes persist to chrome.storage.local immediately

### Thumbnail Generation
1. User adds a bookmark or clicks "Capture" in BookmarkModal
2. New tab page sends message to background service worker via `chrome.runtime.sendMessage`
3. Service worker creates a tab with the URL, waits for `chrome.tabs.onUpdated` with status "complete"
4. Service worker calls `chrome.tabs.captureVisibleTab` to screenshot the tab
5. Image is resized to 480x360 via OffscreenCanvas, compressed to JPEG (quality 0.7)
6. Base64 result sent back to new tab page, stored in chrome.storage.local
7. Capture tab is closed, original tab is re-focused
8. **Fallback:** If capture fails, use Google's favicon service (`https://www.google.com/s2/favicons?domain={domain}&sz=64`) + extract dominant color for card background

### Search (Command Palette)
- Reads all bookmarks from Chrome Bookmarks API (not just current folder)
- Filters by title and URL substring match (case-insensitive)
- Results sorted: exact title match first, then title contains, then URL contains
- Max 20 results displayed
- Debounced input (150ms)

### Chrome Bookmarks Sync
The background service worker listens to:
- `chrome.bookmarks.onCreated` — add entry to store with default position
- `chrome.bookmarks.onRemoved` — remove entry and thumbnail from store
- `chrome.bookmarks.onChanged` — update title/URL in store
- `chrome.bookmarks.onMoved` — update folder and position in store

This keeps the extension in sync when users add/remove bookmarks via Chrome's native UI (Ctrl+D, bookmarks bar, etc.).

## First-Run Experience
On first install (detected by checking chrome.storage.local for an init flag):
1. Read bookmarks from Chrome's "Bookmarks Bar" folder via `chrome.bookmarks.getTree()`
2. Create folder entries for each subfolder found
3. Create bookmark entries with sequential positions
4. Set default settings (dark theme, rounded cards, 4 columns, medium grid)
5. Show a brief welcome toast: "Press Ctrl+K to search, drag to reorder, right-click for options"

## Default Settings

```ts
const DEFAULT_SETTINGS: Settings = {
  background: { type: 'color', value: '#0f172a' },
  theme: 'dark',
  accentColor: '#3b82f6',
  cardStyle: 'rounded',
  fontFamily: 'Inter',
  cardOpacity: 0.9,
  gridSize: 'medium',
  columns: 4,
}
```

## Chrome Permissions Justification

| Permission | Why |
|---|---|
| `bookmarks` | Read/write Chrome's native bookmark tree |
| `storage` | Persist custom metadata and settings locally |
| `activeTab` | Required for `captureVisibleTab` to take thumbnails |
| `tabs` | Create hidden tabs for thumbnail capture, listen for tab updates |


Note: Favicons are fetched via Google's public favicon service (`https://www.google.com/s2/favicons`), which requires no special permission.

# Bookmarks Manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that replaces the new tab page with a visual, customizable speed dial bookmarks manager.

**Architecture:** React 19 SPA served as Chrome's new tab override. Zustand stores persist to `chrome.storage.local`. Background service worker handles thumbnail capture and syncs with Chrome's native bookmarks API. @dnd-kit handles all drag-and-drop interactions.

**Tech Stack:** React 19, TypeScript, Vite, CRXJS, Tailwind CSS v4, Zustand, @dnd-kit, Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-speed-dial-bookmarks-design.md`

---

## File Structure

```
bookmarks-manager/
├── src/
│   ├── newtab/
│   │   ├── App.tsx              # Root component, assembles all UI
│   │   ├── main.tsx             # React entry point
│   │   └── index.html           # HTML entry for new tab
│   ├── background/
│   │   └── index.ts             # Service worker: thumbnail capture + bookmark sync
│   ├── components/
│   │   ├── BackgroundLayer.tsx   # Full-page background renderer
│   │   ├── TopBar.tsx           # Search, grid toggle, settings gear
│   │   ├── FolderTabs.tsx       # Folder tab bar with drag reorder
│   │   ├── BookmarkGrid.tsx     # Sortable grid of bookmark cards
│   │   ├── BookmarkCard.tsx     # Individual bookmark tile
│   │   ├── AddBookmarkCard.tsx  # "+" card to add new bookmark
│   │   ├── CommandPalette.tsx   # Ctrl+K global search modal
│   │   ├── SettingsPanel.tsx    # Right slide-out settings drawer
│   │   ├── BookmarkModal.tsx    # Add/edit bookmark form modal
│   │   ├── FolderModal.tsx      # Add/edit folder form modal
│   │   └── ContextMenu.tsx      # Right-click context menu
│   ├── hooks/
│   │   ├── use-bookmarks.ts     # Hook to access bookmark store
│   │   ├── use-settings.ts      # Hook to access settings store
│   │   ├── use-command-palette.ts # Keyboard shortcut + search logic
│   │   └── use-context-menu.ts  # Right-click positioning + state
│   ├── stores/
│   │   ├── bookmark-store.ts    # Zustand: bookmarks, folders, CRUD
│   │   └── settings-store.ts    # Zustand: theme, layout, background
│   ├── lib/
│   │   ├── chrome-bookmarks.ts  # Chrome Bookmarks API wrapper
│   │   ├── chrome-storage.ts    # Chrome Storage API wrapper
│   │   ├── thumbnail.ts         # Thumbnail capture/resize helpers
│   │   └── cn.ts                # clsx + tailwind-merge utility
│   └── types/
│       └── index.ts             # All TypeScript types
├── public/
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
├── manifest.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .prettierrc
└── .eslintrc.cjs
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `.prettierrc`, `.eslintrc.cjs`, `manifest.json`, `src/newtab/index.html`, `src/newtab/main.tsx`, `src/newtab/App.tsx`, `src/lib/cn.ts`, `public/icons/` (placeholder PNGs)

- [ ] **Step 1: Initialize project with yarn**

```bash
cd /e/projects/my-projects/bookmarks-manager
yarn init -y
```

- [ ] **Step 2: Install core dependencies**

```bash
yarn add react@^19 react-dom@^19
yarn add -D typescript @types/react @types/react-dom vite @crxjs/vite-plugin@beta tailwindcss @tailwindcss/vite clsx tailwind-merge
```

- [ ] **Step 3: Install tooling dependencies**

```bash
yarn add -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-import prettier vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import manifest from './manifest.json'
import path from 'path'

export default defineConfig({
  plugins: [crx({ manifest }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 6: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Bookmarks Manager",
  "description": "A visual speed dial bookmarks manager that replaces your new tab page",
  "version": "1.0.0",
  "permissions": ["bookmarks", "storage", "activeTab", "tabs"],
  "chrome_url_overrides": {
    "newtab": "src/newtab/index.html"
  },
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "icons": {
    "16": "public/icons/icon-16.png",
    "32": "public/icons/icon-32.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  }
}
```

- [ ] **Step 7: Create .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

- [ ] **Step 8: Create .eslintrc.cjs**

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
```

- [ ] **Step 9: Create src/newtab/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Tab</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create src/newtab/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import '../styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Create src/styles.css**

```css
@import 'tailwindcss';
```

- [ ] **Step 12: Create src/newtab/App.tsx**

```tsx
export function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <h1 className="text-2xl font-bold">Bookmarks Manager</h1>
    </div>
  )
}
```

- [ ] **Step 13: Create src/lib/cn.ts**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 14: Create src/test-setup.ts**

```ts
import '@testing-library/jest-dom/vitest'

// Mock Chrome APIs globally for tests
const chromeMock = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
  },
  bookmarks: {
    getTree: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: '1' }),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
    move: vi.fn().mockResolvedValue({}),
    onCreated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
    onChanged: { addListener: vi.fn() },
    onMoved: { addListener: vi.fn() },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue(null),
    onMessage: { addListener: vi.fn() },
  },
  tabs: {
    create: vi.fn().mockResolvedValue({ id: 1 }),
    remove: vi.fn().mockResolvedValue(undefined),
    captureVisibleTab: vi.fn().mockResolvedValue('data:image/jpeg;base64,'),
    onUpdated: { addListener: vi.fn() },
  },
}

vi.stubGlobal('chrome', chromeMock)
```

- [ ] **Step 15: Create placeholder extension icons**

Generate simple colored 16x16, 32x32, 48x48, 128x128 PNG files in `public/icons/`. These can be simple colored squares — replaced with real icons later.

- [ ] **Step 16: Create src/background/index.ts (empty shell)**

```ts
// Background service worker — implemented in Task 18
export {}
```

- [ ] **Step 17: Verify the project builds and dev server starts**

```bash
cd /e/projects/my-projects/bookmarks-manager
yarn dev
```

Expected: Vite starts, CRXJS builds the extension. Verify no errors.

- [ ] **Step 18: Commit**

```bash
git add -A
git commit -m "chore: scaffold project with Vite, CRXJS, React, Tailwind"
```

---

## Task 2: Types and Data Model

**Files:**
- Create: `src/types/index.ts`
- Test: `src/types/index.test.ts`

- [ ] **Step 1: Create src/types/index.ts**

```ts
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

/** A Chrome folder enriched with custom metadata */
export type EnrichedFolder = {
  chromeId: string
  title: string
  position: number
  icon?: string
  color?: string
  bookmarkCount: number
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
```

- [ ] **Step 2: Write type assertion test**

Create `src/types/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, GRID_SIZE_MAP } from './index'
import type { Settings, BookmarkEntry, Folder } from './index'

describe('types', () => {
  it('DEFAULT_SETTINGS has all required fields', () => {
    const settings: Settings = DEFAULT_SETTINGS
    expect(settings.theme).toBe('dark')
    expect(settings.columns).toBe(4)
    expect(settings.background.type).toBe('color')
    expect(settings.cardStyle).toBe('rounded')
    expect(settings.gridSize).toBe('medium')
  })

  it('GRID_SIZE_MAP has all sizes', () => {
    expect(GRID_SIZE_MAP.small.width).toBe(120)
    expect(GRID_SIZE_MAP.medium.width).toBe(180)
    expect(GRID_SIZE_MAP.large.width).toBe(240)
  })
})
```

- [ ] **Step 3: Run test**

```bash
yarn vitest run src/types/index.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types and data model"
```

---

## Task 3: Chrome Storage Abstraction

**Files:**
- Create: `src/lib/chrome-storage.ts`
- Test: `src/lib/chrome-storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/chrome-storage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storageGet, storageSet, storageRemove } from './chrome-storage'

describe('chrome-storage', () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockReset()
    vi.mocked(chrome.storage.local.set).mockReset()
    vi.mocked(chrome.storage.local.remove).mockReset()
  })

  it('storageGet returns value for key', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({
      bookmarks: { '1': { chromeId: '1', position: 0, thumbnail: null } },
    })
    const result = await storageGet('bookmarks')
    expect(result).toEqual({ '1': { chromeId: '1', position: 0, thumbnail: null } })
  })

  it('storageGet returns defaultValue when key missing', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({})
    const result = await storageGet('bookmarks', {})
    expect(result).toEqual({})
  })

  it('storageSet persists key-value pair', async () => {
    vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)
    await storageSet('settings', { theme: 'dark' })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: { theme: 'dark' } })
  })

  it('storageRemove removes key', async () => {
    vi.mocked(chrome.storage.local.remove).mockResolvedValue(undefined)
    await storageRemove('bookmarks')
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('bookmarks')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn vitest run src/lib/chrome-storage.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement chrome-storage.ts**

```ts
/** Get a value from chrome.storage.local */
export async function storageGet<T>(key: string, defaultValue?: T): Promise<T> {
  const result = await chrome.storage.local.get(key)
  return (result[key] as T) ?? (defaultValue as T)
}

/** Set a value in chrome.storage.local */
export async function storageSet<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

/** Remove a key from chrome.storage.local */
export async function storageRemove(key: string): Promise<void> {
  await chrome.storage.local.remove(key)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn vitest run src/lib/chrome-storage.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/chrome-storage.ts src/lib/chrome-storage.test.ts
git commit -m "feat: add chrome storage abstraction"
```

---

## Task 4: Chrome Bookmarks Abstraction

**Files:**
- Create: `src/lib/chrome-bookmarks.ts`
- Test: `src/lib/chrome-bookmarks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/chrome-bookmarks.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getBookmarkTree,
  getBookmarksBarChildren,
  createBookmark,
  updateBookmark,
  removeBookmark,
  moveBookmark,
  createFolder,
} from './chrome-bookmarks'

const mockTree: chrome.bookmarks.BookmarkTreeNode[] = [
  {
    id: '0',
    title: '',
    children: [
      {
        id: '1',
        title: 'Bookmarks Bar',
        children: [
          { id: '10', title: 'GitHub', url: 'https://github.com', parentId: '1' },
          {
            id: '20',
            title: 'Dev',
            children: [
              { id: '21', title: 'MDN', url: 'https://developer.mozilla.org', parentId: '20' },
            ],
          },
        ],
      },
      { id: '2', title: 'Other Bookmarks', children: [] },
    ],
  },
]

describe('chrome-bookmarks', () => {
  beforeEach(() => {
    vi.mocked(chrome.bookmarks.getTree).mockReset()
    vi.mocked(chrome.bookmarks.create).mockReset()
    vi.mocked(chrome.bookmarks.update).mockReset()
    vi.mocked(chrome.bookmarks.remove).mockReset()
    vi.mocked(chrome.bookmarks.move).mockReset()
  })

  it('getBookmarkTree returns full tree', async () => {
    vi.mocked(chrome.bookmarks.getTree).mockResolvedValue(mockTree)
    const tree = await getBookmarkTree()
    expect(tree[0]?.id).toBe('0')
  })

  it('getBookmarksBarChildren returns bar children', async () => {
    vi.mocked(chrome.bookmarks.getTree).mockResolvedValue(mockTree)
    const children = await getBookmarksBarChildren()
    expect(children).toHaveLength(2)
    expect(children[0]?.title).toBe('GitHub')
  })

  it('createBookmark calls chrome.bookmarks.create', async () => {
    vi.mocked(chrome.bookmarks.create).mockResolvedValue({
      id: '30',
      title: 'New',
      url: 'https://new.com',
    })
    const result = await createBookmark('New', 'https://new.com', '1')
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '1',
      title: 'New',
      url: 'https://new.com',
    })
    expect(result.id).toBe('30')
  })

  it('createFolder calls chrome.bookmarks.create without url', async () => {
    vi.mocked(chrome.bookmarks.create).mockResolvedValue({
      id: '40',
      title: 'Work',
    })
    const result = await createFolder('Work', '1')
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '1',
      title: 'Work',
    })
    expect(result.id).toBe('40')
  })

  it('removeBookmark calls chrome.bookmarks.remove', async () => {
    vi.mocked(chrome.bookmarks.remove).mockResolvedValue(undefined)
    await removeBookmark('10')
    expect(chrome.bookmarks.remove).toHaveBeenCalledWith('10')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn vitest run src/lib/chrome-bookmarks.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement chrome-bookmarks.ts**

```ts
/** Get the full Chrome bookmarks tree */
export async function getBookmarkTree() {
  return chrome.bookmarks.getTree()
}

/** Get direct children of the Bookmarks Bar folder */
export async function getBookmarksBarChildren() {
  const tree = await chrome.bookmarks.getTree()
  const root = tree[0]
  const bookmarksBar = root?.children?.find(
    (node) => node.title === 'Bookmarks Bar' || node.title === 'Bookmarks bar',
  )
  return bookmarksBar?.children ?? []
}

/** Create a new bookmark in a folder */
export async function createBookmark(
  title: string,
  url: string,
  parentId: string,
) {
  return chrome.bookmarks.create({ parentId, title, url })
}

/** Create a new folder */
export async function createFolder(title: string, parentId: string) {
  return chrome.bookmarks.create({ parentId, title })
}

/** Update a bookmark's title and/or URL */
export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string },
) {
  return chrome.bookmarks.update(id, changes)
}

/** Delete a bookmark or folder */
export async function removeBookmark(id: string) {
  return chrome.bookmarks.remove(id)
}

/** Move a bookmark to a different folder */
export async function moveBookmark(
  id: string,
  destination: { parentId?: string; index?: number },
) {
  return chrome.bookmarks.move(id, destination)
}

/** Check if a bookmark node is a folder (no url property) */
export function isFolder(node: chrome.bookmarks.BookmarkTreeNode) {
  return !node.url
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/lib/chrome-bookmarks.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/chrome-bookmarks.ts src/lib/chrome-bookmarks.test.ts
git commit -m "feat: add chrome bookmarks API abstraction"
```

---

## Task 5: Settings Store

**Files:**
- Create: `src/stores/settings-store.ts`
- Test: `src/stores/settings-store.test.ts`
- Create: `src/hooks/use-settings.ts`

- [ ] **Step 1: Install Zustand**

```bash
yarn add zustand
```

- [ ] **Step 2: Write failing tests**

Create `src/stores/settings-store.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsStore } from './settings-store'
import { DEFAULT_SETTINGS } from '@/types'

describe('settings-store', () => {
  beforeEach(() => {
    useSettingsStore.setState({ ...DEFAULT_SETTINGS, _initialized: false })
    vi.mocked(chrome.storage.local.get).mockReset()
    vi.mocked(chrome.storage.local.set).mockReset()
  })

  it('has default settings', () => {
    const state = useSettingsStore.getState()
    expect(state.theme).toBe('dark')
    expect(state.columns).toBe(4)
    expect(state.accentColor).toBe('#3b82f6')
  })

  it('updateSettings merges partial settings', () => {
    useSettingsStore.getState().updateSettings({ theme: 'light', columns: 6 })
    const state = useSettingsStore.getState()
    expect(state.theme).toBe('light')
    expect(state.columns).toBe(6)
    expect(state.cardStyle).toBe('rounded') // unchanged
  })

  it('loadSettings reads from chrome storage', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({
      settings: { ...DEFAULT_SETTINGS, theme: 'light' },
    })
    await useSettingsStore.getState().loadSettings()
    expect(useSettingsStore.getState().theme).toBe('light')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
yarn vitest run src/stores/settings-store.test.ts
```

Expected: FAIL

- [ ] **Step 4: Implement settings-store.ts**

```ts
import { create } from 'zustand'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { storageGet, storageSet } from '@/lib/chrome-storage'

type SettingsState = Settings & {
  _initialized: boolean
  updateSettings: (partial: Partial<Settings>) => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  _initialized: false,

  updateSettings: (partial) => {
    set(partial)
    const { updateSettings, loadSettings, _initialized, ...settings } = get()
    storageSet('settings', settings)
  },

  loadSettings: async () => {
    const saved = await storageGet<Settings | undefined>('settings')
    if (saved) {
      set({ ...saved, _initialized: true })
    } else {
      set({ _initialized: true })
    }
  },
}))
```

- [ ] **Step 5: Create src/hooks/use-settings.ts**

```ts
import { useSettingsStore } from '@/stores/settings-store'

/** Access settings store with selector for re-render optimization */
export function useSettings() {
  return useSettingsStore()
}

/** Access a single setting value */
export function useSetting<K extends keyof ReturnType<typeof useSettingsStore.getState>>(key: K) {
  return useSettingsStore((s) => s[key])
}
```

- [ ] **Step 6: Run tests**

```bash
yarn vitest run src/stores/settings-store.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/stores/settings-store.ts src/stores/settings-store.test.ts src/hooks/use-settings.ts
git commit -m "feat: add settings store with chrome storage persistence"
```

---

## Task 6: Bookmark Store

**Files:**
- Create: `src/stores/bookmark-store.ts`
- Test: `src/stores/bookmark-store.test.ts`
- Create: `src/hooks/use-bookmarks.ts`

- [ ] **Step 1: Write failing tests**

Create `src/stores/bookmark-store.test.ts`:

```ts
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
    const entry: BookmarkEntry = {
      chromeId: '10',
      position: 0,
      thumbnail: null,
    }
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn vitest run src/stores/bookmark-store.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement bookmark-store.ts**

```ts
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
```

- [ ] **Step 4: Create src/hooks/use-bookmarks.ts**

```ts
import { useMemo } from 'react'
import { useBookmarkStore } from '@/stores/bookmark-store'
import type { BookmarkEntry, Folder } from '@/types'

/** Get bookmarks for the active folder, sorted by position */
export function useActiveBookmarks(): BookmarkEntry[] {
  const bookmarks = useBookmarkStore((s) => s.bookmarks)
  const activeFolderId = useBookmarkStore((s) => s.activeFolderId)

  return useMemo(() => {
    // We need chrome bookmark data to filter by parent — handled in App
    // This returns all bookmarks sorted by position for now
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
```

- [ ] **Step 5: Run tests**

```bash
yarn vitest run src/stores/bookmark-store.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/ src/hooks/use-bookmarks.ts
git commit -m "feat: add bookmark store with CRUD and reorder"
```

---

## Task 7: BackgroundLayer Component

**Files:**
- Create: `src/components/BackgroundLayer.tsx`
- Test: `src/components/BackgroundLayer.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/BackgroundLayer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackgroundLayer } from './BackgroundLayer'

describe('BackgroundLayer', () => {
  it('renders solid color background', () => {
    const { container } = render(
      <BackgroundLayer background={{ type: 'color', value: '#0f172a' }} />,
    )
    const layer = container.firstElementChild as HTMLElement
    expect(layer.style.backgroundColor).toBe('rgb(15, 23, 42)')
  })

  it('renders gradient background', () => {
    const { container } = render(
      <BackgroundLayer
        background={{ type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      />,
    )
    const layer = container.firstElementChild as HTMLElement
    expect(layer.style.backgroundImage).toContain('linear-gradient')
  })

  it('renders image background', () => {
    const { container } = render(
      <BackgroundLayer background={{ type: 'image', value: 'https://example.com/bg.jpg' }} />,
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.src).toBe('https://example.com/bg.jpg')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/BackgroundLayer.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement BackgroundLayer.tsx**

```tsx
import { cn } from '@/lib/cn'
import type { Settings } from '@/types'

type BackgroundLayerProps = {
  background: Settings['background']
  className?: string
}

/** Full-page background renderer supporting color, gradient, and image */
export function BackgroundLayer({ background, className }: BackgroundLayerProps) {
  const baseClasses = 'fixed inset-0 -z-10'

  if (background.type === 'image') {
    return (
      <div className={cn(baseClasses, className)}>
        <img
          src={background.value}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    )
  }

  const style: React.CSSProperties =
    background.type === 'gradient'
      ? { backgroundImage: background.value }
      : { backgroundColor: background.value }

  return <div className={cn(baseClasses, className)} style={style} />
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/BackgroundLayer.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BackgroundLayer.tsx src/components/BackgroundLayer.test.tsx
git commit -m "feat: add BackgroundLayer component"
```

---

## Task 8: BookmarkCard Component

**Files:**
- Create: `src/components/BookmarkCard.tsx`
- Test: `src/components/BookmarkCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/BookmarkCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookmarkCard } from './BookmarkCard'

describe('BookmarkCard', () => {
  const defaultProps = {
    title: 'GitHub',
    url: 'https://github.com',
    thumbnail: null,
    cardStyle: 'rounded' as const,
    cardOpacity: 0.9,
    gridSize: 'medium' as const,
    onContextMenu: vi.fn(),
  }

  it('renders bookmark title', () => {
    render(<BookmarkCard {...defaultProps} />)
    expect(screen.getByText('GitHub')).toBeTruthy()
  })

  it('renders thumbnail when provided', () => {
    render(<BookmarkCard {...defaultProps} thumbnail="data:image/jpeg;base64,abc" />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,abc')
  })

  it('renders favicon fallback when no thumbnail', () => {
    render(<BookmarkCard {...defaultProps} />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toContain('google.com/s2/favicons')
  })

  it('opens url on click', () => {
    render(<BookmarkCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://github.com')
  })

  it('calls onContextMenu on right-click', () => {
    render(<BookmarkCard {...defaultProps} />)
    const card = screen.getByText('GitHub').closest('[data-bookmark-card]')!
    fireEvent.contextMenu(card)
    expect(defaultProps.onContextMenu).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/BookmarkCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement BookmarkCard.tsx**

```tsx
import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type BookmarkCardProps = {
  title: string
  url: string
  thumbnail: string | null
  cardStyle: Settings['cardStyle']
  cardOpacity: number
  gridSize: Settings['gridSize']
  accentColor?: string
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

/** Individual bookmark tile with thumbnail and title */
export function BookmarkCard({
  title,
  url,
  thumbnail,
  cardStyle,
  cardOpacity,
  gridSize,
  accentColor,
  onContextMenu,
  className,
}: BookmarkCardProps) {
  const size = GRID_SIZE_MAP[gridSize]
  const domain = getDomain(url)

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  const imgSrc = thumbnail ?? faviconUrl

  const cardClasses = cn(
    'group relative flex flex-col overflow-hidden transition-all duration-200',
    'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
    cardStyle === 'rounded' && 'rounded-xl',
    cardStyle === 'sharp' && 'rounded-none',
    cardStyle === 'glass' && 'rounded-xl backdrop-blur-md border border-white/20',
    className,
  )

  const bgStyle: React.CSSProperties = {
    opacity: cardOpacity,
    backgroundColor: accentColor ?? (cardStyle === 'glass' ? 'rgba(255,255,255,0.1)' : 'rgb(30,41,59)'),
  }

  return (
    <div
      data-bookmark-card
      className={cardClasses}
      style={bgStyle}
      onContextMenu={onContextMenu}
    >
      <a href={url} className="flex flex-col" rel="noopener noreferrer">
        <div
          className="flex items-center justify-center overflow-hidden bg-black/20"
          style={{ width: size.width, height: size.height }}
        >
          <img
            src={imgSrc}
            alt={title}
            className={cn(
              'object-cover',
              thumbnail ? 'h-full w-full' : 'h-8 w-8',
            )}
            loading="lazy"
          />
        </div>
        <div
          className="truncate px-2 py-1.5 text-center text-white"
          style={{ fontSize: size.fontSize, width: size.width }}
        >
          {title}
        </div>
      </a>
    </div>
  )
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/BookmarkCard.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BookmarkCard.tsx src/components/BookmarkCard.test.tsx
git commit -m "feat: add BookmarkCard component"
```

---

## Task 9: AddBookmarkCard Component

**Files:**
- Create: `src/components/AddBookmarkCard.tsx`
- Test: `src/components/AddBookmarkCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/AddBookmarkCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddBookmarkCard } from './AddBookmarkCard'

describe('AddBookmarkCard', () => {
  it('renders + icon', () => {
    render(<AddBookmarkCard gridSize="medium" onClick={vi.fn()} />)
    expect(screen.getByText('+')).toBeTruthy()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<AddBookmarkCard gridSize="medium" onClick={onClick} />)
    fireEvent.click(screen.getByText('+'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/AddBookmarkCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement AddBookmarkCard.tsx**

```tsx
import { cn } from '@/lib/cn'
import { GRID_SIZE_MAP } from '@/types'
import type { Settings } from '@/types'

type AddBookmarkCardProps = {
  gridSize: Settings['gridSize']
  onClick: () => void
  className?: string
}

/** Dashed "+" card for adding a new bookmark */
export function AddBookmarkCard({ gridSize, onClick, className }: AddBookmarkCardProps) {
  const size = GRID_SIZE_MAP[gridSize]
  const totalHeight = size.height + 32 // thumbnail + title area

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-xl border-2 border-dashed border-white/30',
        'text-white/50 transition-all duration-200',
        'hover:border-white/60 hover:text-white/80',
        className,
      )}
      style={{ width: size.width, height: totalHeight }}
    >
      <span className="text-3xl font-light">+</span>
      <span className="mt-1 text-xs">Add bookmark</span>
    </button>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/AddBookmarkCard.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AddBookmarkCard.tsx src/components/AddBookmarkCard.test.tsx
git commit -m "feat: add AddBookmarkCard component"
```

---

## Task 10: ContextMenu Component

**Files:**
- Create: `src/components/ContextMenu.tsx`
- Create: `src/hooks/use-context-menu.ts`
- Test: `src/components/ContextMenu.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/ContextMenu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'

describe('ContextMenu', () => {
  const items = [
    { label: 'Open in new tab', action: vi.fn() },
    { label: 'Edit', action: vi.fn() },
    { label: 'Delete', action: vi.fn(), danger: true },
  ]

  it('renders menu items', () => {
    render(<ContextMenu x={100} y={100} items={items} onClose={vi.fn()} />)
    expect(screen.getByText('Open in new tab')).toBeTruthy()
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('calls action and closes on click', () => {
    const onClose = vi.fn()
    render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />)
    fireEvent.click(screen.getByText('Edit'))
    expect(items[1]!.action).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('positions at cursor coordinates', () => {
    const { container } = render(
      <ContextMenu x={200} y={300} items={items} onClose={vi.fn()} />,
    )
    const menu = container.firstElementChild as HTMLElement
    expect(menu.style.left).toBe('200px')
    expect(menu.style.top).toBe('300px')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/ContextMenu.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement ContextMenu.tsx**

```tsx
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export type ContextMenuItem = {
  label: string
  action: () => void
  danger?: boolean
  icon?: string
}

type ContextMenuProps = {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

/** Right-click context menu positioned at cursor */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-slate-800 py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.action()
            onClose()
          }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
            item.danger
              ? 'text-red-400 hover:bg-red-500/20'
              : 'text-white/80 hover:bg-white/10',
          )}
        >
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create src/hooks/use-context-menu.ts**

```ts
import { useState, useCallback } from 'react'
import type { ContextMenuItem } from '@/components/ContextMenu'

type ContextMenuState = {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

/** Hook for managing right-click context menu state */
export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  })

  const show = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault()
    setMenu({ visible: true, x: e.clientX, y: e.clientY, items })
  }, [])

  const hide = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  return { menu, show, hide }
}
```

- [ ] **Step 5: Run tests**

```bash
yarn vitest run src/components/ContextMenu.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/ContextMenu.tsx src/components/ContextMenu.test.tsx src/hooks/use-context-menu.ts
git commit -m "feat: add ContextMenu component and hook"
```

---

## Task 11: BookmarkModal Component

**Files:**
- Create: `src/components/BookmarkModal.tsx`
- Test: `src/components/BookmarkModal.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/BookmarkModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookmarkModal } from './BookmarkModal'

describe('BookmarkModal', () => {
  const folders = [
    { chromeId: '1', title: 'Social' },
    { chromeId: '2', title: 'Work' },
  ]

  it('renders add mode with empty fields', () => {
    render(
      <BookmarkModal
        mode="add"
        folders={folders}
        currentFolderId="1"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Add Bookmark')).toBeTruthy()
    expect(screen.getByPlaceholderText('Title')).toBeTruthy()
    expect(screen.getByPlaceholderText('URL')).toBeTruthy()
  })

  it('renders edit mode with pre-filled fields', () => {
    render(
      <BookmarkModal
        mode="edit"
        folders={folders}
        currentFolderId="1"
        initialTitle="GitHub"
        initialUrl="https://github.com"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Edit Bookmark')).toBeTruthy()
    expect(screen.getByDisplayValue('GitHub')).toBeTruthy()
    expect(screen.getByDisplayValue('https://github.com')).toBeTruthy()
  })

  it('calls onSave with form data', () => {
    const onSave = vi.fn()
    render(
      <BookmarkModal
        mode="add"
        folders={folders}
        currentFolderId="1"
        onSave={onSave}
        onClose={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://test.com' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({
      title: 'Test',
      url: 'https://test.com',
      folderId: '1',
      thumbnail: null,
    })
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(
      <BookmarkModal
        mode="add"
        folders={folders}
        currentFolderId="1"
        onSave={vi.fn()}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/BookmarkModal.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement BookmarkModal.tsx**

```tsx
import { useState, useRef } from 'react'
import { cn } from '@/lib/cn'

type BookmarkModalProps = {
  mode: 'add' | 'edit'
  folders: Array<{ chromeId: string; title: string }>
  currentFolderId: string
  initialTitle?: string
  initialUrl?: string
  initialThumbnail?: string | null
  onSave: (data: {
    title: string
    url: string
    folderId: string
    thumbnail: string | null
  }) => void
  onClose: () => void
  onCaptureThumbnail?: (url: string) => Promise<string | null>
}

/** Modal form for adding or editing a bookmark */
export function BookmarkModal({
  mode,
  folders,
  currentFolderId,
  initialTitle = '',
  initialUrl = '',
  initialThumbnail = null,
  onSave,
  onClose,
  onCaptureThumbnail,
}: BookmarkModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [url, setUrl] = useState(initialUrl)
  const [folderId, setFolderId] = useState(currentFolderId)
  const [thumbnail, setThumbnail] = useState<string | null>(initialThumbnail)
  const [capturing, setCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    if (!title.trim() || !url.trim()) return
    onSave({ title: title.trim(), url: url.trim(), folderId, thumbnail })
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setThumbnail(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCapture() {
    if (!onCaptureThumbnail || !url.trim()) return
    setCapturing(true)
    const result = await onCaptureThumbnail(url.trim())
    setThumbnail(result)
    setCapturing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {mode === 'add' ? 'Add Bookmark' : 'Edit Bookmark'}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="url"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {folders.map((f) => (
              <option key={f.chromeId} value={f.chromeId}>
                {f.title}
              </option>
            ))}
          </select>

          {/* Thumbnail section */}
          <div className="space-y-2">
            <label className="text-sm text-white/60">Thumbnail</label>
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Thumbnail preview"
                className="h-24 w-full rounded-lg object-cover"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white/80 hover:bg-slate-600"
              >
                Upload
              </button>
              {onCaptureThumbnail && (
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={capturing}
                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white/80 hover:bg-slate-600 disabled:opacity-50"
                >
                  {capturing ? 'Capturing...' : 'Capture'}
                </button>
              )}
              {thumbnail && (
                <button
                  type="button"
                  onClick={() => setThumbnail(null)}
                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-red-400 hover:bg-slate-600"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/BookmarkModal.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BookmarkModal.tsx src/components/BookmarkModal.test.tsx
git commit -m "feat: add BookmarkModal component for add/edit"
```

---

## Task 12: FolderModal Component

**Files:**
- Create: `src/components/FolderModal.tsx`
- Test: `src/components/FolderModal.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/FolderModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FolderModal } from './FolderModal'

describe('FolderModal', () => {
  it('renders add mode', () => {
    render(<FolderModal mode="add" onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Add Folder')).toBeTruthy()
  })

  it('renders edit mode with pre-filled name', () => {
    render(
      <FolderModal mode="edit" initialName="Work" initialIcon="💼" onSave={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByText('Edit Folder')).toBeTruthy()
    expect(screen.getByDisplayValue('Work')).toBeTruthy()
  })

  it('calls onSave with folder data', () => {
    const onSave = vi.fn()
    render(<FolderModal mode="add" onSave={onSave} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Folder name'), { target: { value: 'Dev' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dev' }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/FolderModal.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement FolderModal.tsx**

```tsx
import { useState } from 'react'

const EMOJI_OPTIONS = ['📁', '💼', '🎮', '📰', '🛒', '🎵', '📚', '🔧', '🌐', '❤️', '⭐', '🏠']

type FolderModalProps = {
  mode: 'add' | 'edit'
  initialName?: string
  initialIcon?: string
  initialColor?: string
  onSave: (data: { name: string; icon: string; color: string }) => void
  onClose: () => void
}

/** Modal form for adding or editing a folder */
export function FolderModal({
  mode,
  initialName = '',
  initialIcon = '📁',
  initialColor = '#3b82f6',
  onSave,
  onClose,
}: FolderModalProps) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), icon, color })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {mode === 'add' ? 'Add Folder' : 'Edit Folder'}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="mb-2 block text-sm text-white/60">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`rounded-lg p-2 text-xl transition-colors ${
                    icon === emoji ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg bg-slate-700"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/FolderModal.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FolderModal.tsx src/components/FolderModal.test.tsx
git commit -m "feat: add FolderModal component"
```

---

## Task 13: FolderTabs Component

**Files:**
- Create: `src/components/FolderTabs.tsx`
- Test: `src/components/FolderTabs.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/FolderTabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FolderTabs } from './FolderTabs'
import type { EnrichedFolder } from '@/types'

describe('FolderTabs', () => {
  const folders: EnrichedFolder[] = [
    { chromeId: '1', title: 'Social', position: 0, icon: '🌐', bookmarkCount: 5 },
    { chromeId: '2', title: 'Work', position: 1, icon: '💼', bookmarkCount: 3 },
  ]

  it('renders folder tabs', () => {
    render(
      <FolderTabs
        folders={folders}
        activeFolderId="1"
        accentColor="#3b82f6"
        onSelectFolder={vi.fn()}
        onAddFolder={vi.fn()}
        onContextMenu={vi.fn()}
        onReorder={vi.fn()}
      />,
    )
    expect(screen.getByText('🌐 Social')).toBeTruthy()
    expect(screen.getByText('💼 Work')).toBeTruthy()
  })

  it('highlights active folder', () => {
    render(
      <FolderTabs
        folders={folders}
        activeFolderId="1"
        accentColor="#3b82f6"
        onSelectFolder={vi.fn()}
        onAddFolder={vi.fn()}
        onContextMenu={vi.fn()}
        onReorder={vi.fn()}
      />,
    )
    const activeTab = screen.getByText('🌐 Social').closest('button')
    expect(activeTab?.className).toContain('border-b-2')
  })

  it('calls onSelectFolder when tab clicked', () => {
    const onSelect = vi.fn()
    render(
      <FolderTabs
        folders={folders}
        activeFolderId="1"
        accentColor="#3b82f6"
        onSelectFolder={onSelect}
        onAddFolder={vi.fn()}
        onContextMenu={vi.fn()}
        onReorder={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('💼 Work'))
    expect(onSelect).toHaveBeenCalledWith('2')
  })

  it('renders add folder button', () => {
    render(
      <FolderTabs
        folders={folders}
        activeFolderId="1"
        accentColor="#3b82f6"
        onSelectFolder={vi.fn()}
        onAddFolder={vi.fn()}
        onContextMenu={vi.fn()}
        onReorder={vi.fn()}
      />,
    )
    expect(screen.getByText('+')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/FolderTabs.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement FolderTabs.tsx**

```tsx
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
export function FolderTabs({
  folders,
  activeFolderId,
  accentColor,
  onSelectFolder,
  onAddFolder,
  onContextMenu,
}: FolderTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
      {folders.map((folder) => {
        const isActive = folder.chromeId === activeFolderId
        return (
          <button
            key={folder.chromeId}
            onClick={() => onSelectFolder(folder.chromeId)}
            onContextMenu={(e) => onContextMenu(e, folder.chromeId)}
            className={cn(
              'flex-shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 text-white'
                : 'text-white/60 hover:text-white/80',
            )}
            style={isActive ? { borderColor: accentColor } : undefined}
          >
            {folder.icon ? `${folder.icon} ${folder.title}` : folder.title}
          </button>
        )
      })}
      <button
        onClick={onAddFolder}
        className="flex-shrink-0 rounded-lg px-3 py-2 text-sm text-white/40 transition-colors hover:text-white/70"
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/FolderTabs.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FolderTabs.tsx src/components/FolderTabs.test.tsx
git commit -m "feat: add FolderTabs component"
```

---

## Task 14: TopBar Component

**Files:**
- Create: `src/components/TopBar.tsx`
- Test: `src/components/TopBar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/TopBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders search, grid toggle, and settings buttons', () => {
    render(
      <TopBar
        gridSize="medium"
        onOpenSearch={vi.fn()}
        onCycleGridSize={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Search')).toBeTruthy()
    expect(screen.getByLabelText('Grid size')).toBeTruthy()
    expect(screen.getByLabelText('Settings')).toBeTruthy()
  })

  it('calls onOpenSearch when search clicked', () => {
    const onOpenSearch = vi.fn()
    render(
      <TopBar
        gridSize="medium"
        onOpenSearch={onOpenSearch}
        onCycleGridSize={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByLabelText('Search'))
    expect(onOpenSearch).toHaveBeenCalledOnce()
  })

  it('displays current grid size label', () => {
    render(
      <TopBar
        gridSize="large"
        onOpenSearch={vi.fn()}
        onCycleGridSize={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    )
    expect(screen.getByText('L')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/TopBar.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement TopBar.tsx**

```tsx
import type { Settings } from '@/types'

const GRID_SIZE_LABELS = { small: 'S', medium: 'M', large: 'L' } as const

type TopBarProps = {
  gridSize: Settings['gridSize']
  onOpenSearch: () => void
  onCycleGridSize: () => void
  onOpenSettings: () => void
}

/** Top bar with search, grid toggle, and settings gear */
export function TopBar({
  gridSize,
  onOpenSearch,
  onCycleGridSize,
  onOpenSettings,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        aria-label="Search"
        onClick={onOpenSearch}
        className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <button
          aria-label="Grid size"
          onClick={onCycleGridSize}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {GRID_SIZE_LABELS[gridSize]}
        </button>
        <button
          aria-label="Settings"
          onClick={onOpenSettings}
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/TopBar.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TopBar.tsx src/components/TopBar.test.tsx
git commit -m "feat: add TopBar component"
```

---

## Task 15: BookmarkGrid with Drag-and-Drop

**Files:**
- Create: `src/components/BookmarkGrid.tsx`
- Test: `src/components/BookmarkGrid.test.tsx`

- [ ] **Step 1: Install dnd-kit**

```bash
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Write failing test**

Create `src/components/BookmarkGrid.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookmarkGrid } from './BookmarkGrid'
import type { EnrichedBookmark, Settings } from '@/types'

describe('BookmarkGrid', () => {
  const bookmarks: EnrichedBookmark[] = [
    { chromeId: '1', title: 'GitHub', url: 'https://github.com', position: 0, thumbnail: null, parentId: '10' },
    { chromeId: '2', title: 'Twitter', url: 'https://x.com', position: 1, thumbnail: null, parentId: '10' },
  ]

  const settings: Pick<Settings, 'cardStyle' | 'cardOpacity' | 'gridSize' | 'columns'> = {
    cardStyle: 'rounded',
    cardOpacity: 0.9,
    gridSize: 'medium',
    columns: 4,
  }

  it('renders bookmark cards', () => {
    render(
      <BookmarkGrid
        bookmarks={bookmarks}
        settings={settings}
        onReorder={vi.fn()}
        onAddBookmark={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    )
    expect(screen.getByText('GitHub')).toBeTruthy()
    expect(screen.getByText('Twitter')).toBeTruthy()
  })

  it('renders add bookmark card at the end', () => {
    render(
      <BookmarkGrid
        bookmarks={bookmarks}
        settings={settings}
        onReorder={vi.fn()}
        onAddBookmark={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    )
    expect(screen.getByText('Add bookmark')).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
yarn vitest run src/components/BookmarkGrid.test.tsx
```

Expected: FAIL

- [ ] **Step 4: Implement BookmarkGrid.tsx**

```tsx
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
import { AddBookmarkCard } from './AddBookmarkCard'
import type { EnrichedBookmark, Settings } from '@/types'

type BookmarkGridProps = {
  bookmarks: EnrichedBookmark[]
  settings: Pick<Settings, 'cardStyle' | 'cardOpacity' | 'gridSize' | 'columns'>
  onReorder: (orderedIds: string[]) => void
  onAddBookmark: () => void
  onContextMenu: (e: React.MouseEvent, chromeId: string) => void
}

function SortableBookmarkCard({
  bookmark,
  settings,
  onContextMenu,
}: {
  bookmark: EnrichedBookmark
  settings: BookmarkGridProps['settings']
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: bookmark.chromeId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkCard
        title={bookmark.customTitle ?? bookmark.title}
        url={bookmark.url}
        thumbnail={bookmark.thumbnail}
        cardStyle={settings.cardStyle}
        cardOpacity={settings.cardOpacity}
        gridSize={settings.gridSize}
        accentColor={bookmark.accentColor}
        onContextMenu={onContextMenu}
      />
    </div>
  )
}

/** Sortable grid of bookmark cards with drag-and-drop */
export function BookmarkGrid({
  bookmarks,
  settings,
  onReorder,
  onAddBookmark,
  onContextMenu,
}: BookmarkGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={bookmarks.map((b) => b.chromeId)}
        strategy={rectSortingStrategy}
      >
        <div
          className="grid justify-center gap-4 p-4"
          style={{
            gridTemplateColumns: `repeat(${settings.columns}, max-content)`,
          }}
        >
          {bookmarks.map((bookmark) => (
            <SortableBookmarkCard
              key={bookmark.chromeId}
              bookmark={bookmark}
              settings={settings}
              onContextMenu={(e) => onContextMenu(e, bookmark.chromeId)}
            />
          ))}
          <AddBookmarkCard
            gridSize={settings.gridSize}
            onClick={onAddBookmark}
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
yarn vitest run src/components/BookmarkGrid.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BookmarkGrid.tsx src/components/BookmarkGrid.test.tsx
git commit -m "feat: add BookmarkGrid with dnd-kit drag-and-drop"
```

---

## Task 16: CommandPalette Component

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Create: `src/hooks/use-command-palette.ts`
- Test: `src/components/CommandPalette.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/CommandPalette.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'
import type { EnrichedBookmark } from '@/types'

describe('CommandPalette', () => {
  const bookmarks: EnrichedBookmark[] = [
    { chromeId: '1', title: 'GitHub', url: 'https://github.com', position: 0, thumbnail: null, parentId: '10' },
    { chromeId: '2', title: 'Google', url: 'https://google.com', position: 1, thumbnail: null, parentId: '10' },
    { chromeId: '3', title: 'Twitter', url: 'https://x.com', position: 2, thumbnail: null, parentId: '20' },
  ]

  it('renders search input', () => {
    render(
      <CommandPalette
        bookmarks={bookmarks}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByPlaceholderText('Search all bookmarks...')).toBeTruthy()
  })

  it('filters bookmarks by title', () => {
    render(
      <CommandPalette
        bookmarks={bookmarks}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search all bookmarks...'), {
      target: { value: 'git' },
    })
    expect(screen.getByText('GitHub')).toBeTruthy()
    expect(screen.queryByText('Twitter')).toBeNull()
  })

  it('filters bookmarks by URL', () => {
    render(
      <CommandPalette
        bookmarks={bookmarks}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search all bookmarks...'), {
      target: { value: 'x.com' },
    })
    expect(screen.getByText('Twitter')).toBeTruthy()
    expect(screen.queryByText('GitHub')).toBeNull()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <CommandPalette
        bookmarks={bookmarks}
        onClose={onClose}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.keyDown(screen.getByPlaceholderText('Search all bookmarks...'), {
      key: 'Escape',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/CommandPalette.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement CommandPalette.tsx**

```tsx
import { useState, useRef, useEffect, useMemo } from 'react'
import type { EnrichedBookmark } from '@/types'

type CommandPaletteProps = {
  bookmarks: EnrichedBookmark[]
  onClose: () => void
  onEdit: (chromeId: string) => void
  onDelete: (chromeId: string) => void
}

/** Ctrl+K command palette for global bookmark search */
export function CommandPalette({
  bookmarks,
  onClose,
  onEdit,
  onDelete,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return bookmarks.slice(0, 20)
    const q = query.toLowerCase()
    return bookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        const aExact = aTitle === q
        const bExact = bTitle === q
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        const aStarts = aTitle.startsWith(q)
        const bStarts = bTitle.startsWith(q)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return 0
      })
      .slice(0, 20)
  }, [bookmarks, query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const selected = results[selectedIndex]
      if (selected) {
        window.open(selected.url, '_self')
      }
    }
  }

  function getDomain(url: string) {
    try { return new URL(url).hostname } catch { return url }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all bookmarks..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
          />
          <kbd className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white/40">Esc</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-white/40">No bookmarks found</p>
          )}
          {results.map((bookmark, index) => (
            <div
              key={bookmark.chromeId}
              className={`flex items-center gap-3 px-4 py-2 ${
                index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`}
                alt=""
                className="h-5 w-5"
              />
              <a
                href={bookmark.url}
                className="flex-1 truncate"
              >
                <span className="text-sm text-white">{bookmark.title}</span>
                <span className="ml-2 text-xs text-white/40">{getDomain(bookmark.url)}</span>
              </a>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(bookmark.chromeId) }}
                  className="rounded p-1 text-white/30 hover:bg-white/10 hover:text-white/60"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(bookmark.chromeId) }}
                  className="rounded p-1 text-white/30 hover:bg-red-500/20 hover:text-red-400"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/hooks/use-command-palette.ts**

```ts
import { useState, useEffect, useCallback } from 'react'

/** Hook for Ctrl+K command palette keyboard shortcut */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { isOpen, open, close }
}
```

- [ ] **Step 5: Run tests**

```bash
yarn vitest run src/components/CommandPalette.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/CommandPalette.tsx src/components/CommandPalette.test.tsx src/hooks/use-command-palette.ts
git commit -m "feat: add CommandPalette with search and keyboard nav"
```

---

## Task 17: SettingsPanel Component

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Test: `src/components/SettingsPanel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/SettingsPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPanel } from './SettingsPanel'
import { DEFAULT_SETTINGS } from '@/types'

describe('SettingsPanel', () => {
  it('renders settings title', () => {
    render(
      <SettingsPanel
        settings={DEFAULT_SETTINGS}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('renders theme toggle', () => {
    render(
      <SettingsPanel
        settings={DEFAULT_SETTINGS}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Light')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()
  })

  it('renders card style options', () => {
    render(
      <SettingsPanel
        settings={DEFAULT_SETTINGS}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Rounded')).toBeTruthy()
    expect(screen.getByText('Sharp')).toBeTruthy()
    expect(screen.getByText('Glass')).toBeTruthy()
  })

  it('calls onUpdate when theme changes', () => {
    const onUpdate = vi.fn()
    render(
      <SettingsPanel
        settings={DEFAULT_SETTINGS}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Light'))
    expect(onUpdate).toHaveBeenCalledWith({ theme: 'light' })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <SettingsPanel
        settings={DEFAULT_SETTINGS}
        onUpdate={onClose}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/components/SettingsPanel.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement SettingsPanel.tsx**

```tsx
import { useRef } from 'react'
import { cn } from '@/lib/cn'
import type { Settings } from '@/types'

const FONT_OPTIONS = [
  'Inter',
  'System UI',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Raleway',
  'Nunito',
]

type SettingsPanelProps = {
  settings: Settings
  onUpdate: (partial: Partial<Settings>) => void
  onClose: () => void
  onBackgroundImageUpload?: (dataUrl: string) => void
}

/** Slide-out settings panel from the right */
export function SettingsPanel({
  settings,
  onUpdate,
  onClose,
  onBackgroundImageUpload,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      onUpdate({ background: { type: 'image', value: dataUrl } })
      onBackgroundImageUpload?.(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[300px] overflow-y-auto border-l border-white/10 bg-slate-900 p-5 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <button
          aria-label="Close settings"
          onClick={onClose}
          className="rounded-lg p-1 text-white/40 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Background */}
        <Section title="Background">
          <div className="flex gap-2">
            {(['color', 'gradient', 'image'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  if (type === 'color') onUpdate({ background: { type, value: '#0f172a' } })
                  if (type === 'gradient') onUpdate({ background: { type, value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } })
                  if (type === 'image') fileInputRef.current?.click()
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs capitalize',
                  settings.background.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white/60 hover:text-white',
                )}
              >
                {type}
              </button>
            ))}
          </div>
          {settings.background.type === 'color' && (
            <input
              type="color"
              value={settings.background.value}
              onChange={(e) => onUpdate({ background: { type: 'color', value: e.target.value } })}
              className="mt-2 h-8 w-full cursor-pointer rounded bg-slate-700"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </Section>

        {/* Theme */}
        <Section title="Theme">
          <div className="flex gap-2">
            {(['light', 'dark'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => onUpdate({ theme })}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-sm capitalize',
                  settings.theme === theme
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white/60 hover:text-white',
                )}
              >
                {theme}
              </button>
            ))}
          </div>
        </Section>

        {/* Accent Color */}
        <Section title="Accent Color">
          <input
            type="color"
            value={settings.accentColor}
            onChange={(e) => onUpdate({ accentColor: e.target.value })}
            className="h-8 w-full cursor-pointer rounded bg-slate-700"
          />
        </Section>

        {/* Card Style */}
        <Section title="Card Style">
          <div className="flex gap-2">
            {(['rounded', 'sharp', 'glass'] as const).map((style) => (
              <button
                key={style}
                onClick={() => onUpdate({ cardStyle: style })}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-sm capitalize',
                  settings.cardStyle === style
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white/60 hover:text-white',
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </Section>

        {/* Font */}
        <Section title="Font">
          <select
            value={settings.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-white outline-none"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </Section>

        {/* Card Opacity */}
        <Section title={`Card Opacity — ${Math.round(settings.cardOpacity * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.cardOpacity}
            onChange={(e) => onUpdate({ cardOpacity: Number(e.target.value) })}
            className="w-full"
          />
        </Section>

        {/* Grid Size */}
        <Section title="Grid Size">
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => onUpdate({ gridSize: size })}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-sm',
                  settings.gridSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white/60 hover:text-white',
                )}
              >
                {size[0]?.toUpperCase()}
              </button>
            ))}
          </div>
        </Section>

        {/* Columns */}
        <Section title={`Columns — ${settings.columns}`}>
          <input
            type="range"
            min={3}
            max={8}
            step={1}
            value={settings.columns}
            onChange={(e) => onUpdate({ columns: Number(e.target.value) })}
            className="w-full"
          />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase text-white/40">
        {title}
      </label>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/components/SettingsPanel.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/SettingsPanel.test.tsx
git commit -m "feat: add SettingsPanel with full customization controls"
```

---

## Task 18: Background Service Worker

**Files:**
- Modify: `src/background/index.ts`
- Create: `src/lib/thumbnail.ts`
- Test: `src/lib/thumbnail.test.ts`

- [ ] **Step 1: Write failing test for thumbnail utility**

Create `src/lib/thumbnail.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getFaviconUrl, getDomain } from './thumbnail'

describe('thumbnail utils', () => {
  it('getFaviconUrl returns google favicon service URL', () => {
    const url = getFaviconUrl('https://github.com')
    expect(url).toBe('https://www.google.com/s2/favicons?domain=github.com&sz=64')
  })

  it('getDomain extracts hostname', () => {
    expect(getDomain('https://github.com/anthropics')).toBe('github.com')
    expect(getDomain('https://www.google.com/search?q=test')).toBe('www.google.com')
  })

  it('getDomain handles invalid URL gracefully', () => {
    expect(getDomain('not-a-url')).toBe('not-a-url')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run src/lib/thumbnail.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement thumbnail.ts**

```ts
/** Extract domain from a URL */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Get Google favicon service URL for a site */
export function getFaviconUrl(url: string): string {
  const domain = getDomain(url)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

/** Request thumbnail capture from the background service worker */
export async function requestThumbnailCapture(url: string): Promise<string | null> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'capture-thumbnail',
      url,
    })
    return response?.data ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests**

```bash
yarn vitest run src/lib/thumbnail.test.ts
```

Expected: PASS

- [ ] **Step 5: Implement background service worker**

Replace `src/background/index.ts`:

```ts
// Listen for thumbnail capture requests from the new tab page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'capture-thumbnail') {
    captureThumbnail(message.url)
      .then((data) => sendResponse({ data }))
      .catch(() => sendResponse({ data: null }))
    return true // keep message channel open for async response
  }
})

// Sync bookmarks when user modifies them via Chrome's native UI
chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
  // Notify any open new tab pages to refresh
  notifyNewTab({ type: 'bookmark-created', bookmark })
})

chrome.bookmarks.onRemoved.addListener((id) => {
  notifyNewTab({ type: 'bookmark-removed', id })
})

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  notifyNewTab({ type: 'bookmark-changed', id, changeInfo })
})

chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
  notifyNewTab({ type: 'bookmark-moved', id, moveInfo })
})

async function captureThumbnail(url: string): Promise<string | null> {
  let tab: chrome.tabs.Tab | null = null
  try {
    tab = await chrome.tabs.create({ url, active: true })

    // Wait for page to finish loading
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener)
        reject(new Error('Timeout'))
      }, 15000)

      function listener(tabId: number, info: chrome.tabs.TabChangeInfo) {
        if (tabId === tab!.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener)
          clearTimeout(timeout)
          // Small delay for rendering
          setTimeout(resolve, 1500)
        }
      }
      chrome.tabs.onUpdated.addListener(listener)
    })

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId!, { format: 'jpeg', quality: 70 })
    return dataUrl
  } catch {
    return null
  } finally {
    if (tab?.id) {
      chrome.tabs.remove(tab.id).catch(() => {})
    }
  }
}

function notifyNewTab(message: Record<string, unknown>) {
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners — new tab page not open, ignore
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add src/background/index.ts src/lib/thumbnail.ts src/lib/thumbnail.test.ts
git commit -m "feat: add background service worker and thumbnail utilities"
```

---

## Task 19: App Assembly — Wire Everything Together

**Files:**
- Modify: `src/newtab/App.tsx`

- [ ] **Step 1: Implement the full App component**

Replace `src/newtab/App.tsx`:

```tsx
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
import { useSettingsStore } from '@/stores/settings-store'
import { useBookmarkStore } from '@/stores/bookmark-store'
import { useCommandPalette } from '@/hooks/use-command-palette'
import { useContextMenu } from '@/hooks/use-context-menu'
import {
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

  // Initialize on mount
  useEffect(() => {
    async function init() {
      await settings.loadSettings()
      await bookmarkStore.loadBookmarks()

      const children = await getBookmarksBarChildren()
      setChromeNodes(children)

      // First-run: import bookmarks if store is empty
      const initialized = await storageGet<boolean>('initialized', false)
      if (!initialized) {
        await importBookmarks(children)
        await storageSet('initialized', true)
      }

      // Set active folder to first folder if not set
      if (!bookmarkStore.activeFolderId) {
        const firstFolder = children.find(isFolder)
        if (firstFolder) {
          bookmarkStore.setActiveFolderId(firstFolder.id)
        }
      }
    }
    init()
  }, [])

  async function importBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
    let folderPos = 0
    let bookmarkPos = 0
    for (const node of nodes) {
      if (isFolder(node)) {
        bookmarkStore.addFolder({
          chromeId: node.id,
          position: folderPos++,
          icon: '📁',
        })
        // Import bookmarks inside folder
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
        // Top-level bookmark without folder — skip or add to root
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
    return chromeNodes
      .filter(isFolder)
      .map((node) => {
        const custom = bookmarkStore.folders[node.id]
        return {
          chromeId: node.id,
          title: node.title,
          position: custom?.position ?? 0,
          icon: custom?.icon,
          color: custom?.color,
          bookmarkCount: node.children?.filter((c) => !isFolder(c)).length ?? 0,
        }
      })
      .sort((a, b) => a.position - b.position)
  }, [chromeNodes, bookmarkStore.folders])

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

  // Grid size cycling
  const cycleGridSize = useCallback(() => {
    const order: Settings['gridSize'][] = ['small', 'medium', 'large']
    const current = order.indexOf(settings.gridSize)
    const next = order[(current + 1) % order.length]!
    settings.updateSettings({ gridSize: next })
  }, [settings.gridSize])

  // Bookmark CRUD handlers
  async function handleAddBookmark(data: { title: string; url: string; folderId: string; thumbnail: string | null }) {
    const created = await createBookmark(data.title, data.url, data.folderId)
    bookmarkStore.addBookmark({
      chromeId: created.id,
      position: activeBookmarks.length,
      thumbnail: data.thumbnail,
    })
    const children = await getBookmarksBarChildren()
    setChromeNodes(children)
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
    const bookmarksBar = chromeNodes.length > 0 ? chromeNodes[0]?.parentId : '1'
    const created = await createChromeFolder(data.name, bookmarksBar ?? '1')
    bookmarkStore.addFolder({
      chromeId: created.id,
      position: enrichedFolders.length,
      icon: data.icon,
      color: data.color,
    })
    bookmarkStore.setActiveFolderId(created.id)
    const children = await getBookmarksBarChildren()
    setChromeNodes(children)
    setModal({ type: 'none' })
  }

  // Context menu for bookmarks
  function showBookmarkContextMenu(e: React.MouseEvent, chromeId: string) {
    const bookmark = allEnrichedBookmarks.find((b) => b.chromeId === chromeId)
    if (!bookmark) return

    const items: ContextMenuItem[] = [
      { label: 'Open in new tab', icon: '↗', action: () => window.open(bookmark.url, '_blank') },
      {
        label: 'Edit',
        icon: '✏️',
        action: () => setModal({
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
      { label: 'Delete', icon: '🗑️', danger: true, action: () => handleDeleteBookmark(chromeId) },
    ]
    contextMenu.show(e, items)
  }

  // Context menu for folders
  function showFolderContextMenu(e: React.MouseEvent, folderId: string) {
    const folder = enrichedFolders.find((f) => f.chromeId === folderId)
    if (!folder) return

    const items: ContextMenuItem[] = [
      {
        label: 'Edit',
        icon: '✏️',
        action: () => setModal({
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
          const children = await getBookmarksBarChildren()
          setChromeNodes(children)
          if (bookmarkStore.activeFolderId === folderId) {
            const first = children.find(isFolder)
            bookmarkStore.setActiveFolderId(first?.id ?? null)
          }
        },
      },
    ]
    contextMenu.show(e, items)
  }

  const fontStyle = { fontFamily: settings.fontFamily }

  return (
    <div className="min-h-screen" style={fontStyle}>
      <BackgroundLayer background={settings.background} />

      <div className="relative z-10">
        <TopBar
          gridSize={settings.gridSize}
          onOpenSearch={commandPalette.open}
          onCycleGridSize={cycleGridSize}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <FolderTabs
          folders={enrichedFolders}
          activeFolderId={bookmarkStore.activeFolderId}
          accentColor={settings.accentColor}
          onSelectFolder={(id) => bookmarkStore.setActiveFolderId(id)}
          onAddFolder={() => setModal({ type: 'add-folder' })}
          onContextMenu={showFolderContextMenu}
          onReorder={(ids) => bookmarkStore.reorderFolders(ids)}
        />

        <BookmarkGrid
          bookmarks={activeBookmarks}
          settings={settings}
          onReorder={(ids) => bookmarkStore.reorderBookmarks(ids)}
          onAddBookmark={() => setModal({ type: 'add-bookmark' })}
          onContextMenu={showBookmarkContextMenu}
        />
      </div>

      {/* Command Palette */}
      {commandPalette.isOpen && (
        <CommandPalette
          bookmarks={allEnrichedBookmarks}
          onClose={commandPalette.close}
          onEdit={(id) => {
            commandPalette.close()
            const bm = allEnrichedBookmarks.find((b) => b.chromeId === id)
            if (bm) setModal({ type: 'edit-bookmark', chromeId: id, title: bm.title, url: bm.url, thumbnail: bm.thumbnail })
          }}
          onDelete={(id) => { commandPalette.close(); handleDeleteBookmark(id) }}
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
          folders={enrichedFolders.map((f) => ({ chromeId: f.chromeId, title: f.title }))}
          currentFolderId={bookmarkStore.activeFolderId ?? ''}
          onSave={handleAddBookmark}
          onClose={() => setModal({ type: 'none' })}
          onCaptureThumbnail={requestThumbnailCapture}
        />
      )}
      {modal.type === 'edit-bookmark' && (
        <BookmarkModal
          mode="edit"
          folders={enrichedFolders.map((f) => ({ chromeId: f.chromeId, title: f.title }))}
          currentFolderId={bookmarkStore.activeFolderId ?? ''}
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
            bookmarkStore.updateFolder(modal.chromeId, { icon: data.icon, color: data.color })
            const children = await getBookmarksBarChildren()
            setChromeNodes(children)
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
    </div>
  )
}
```

- [ ] **Step 2: Verify the app builds**

```bash
cd /e/projects/my-projects/bookmarks-manager
yarn build
```

Expected: Build succeeds with no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/newtab/App.tsx
git commit -m "feat: assemble App with all components wired together"
```

---

## Task 20: First-Run Welcome Toast and Final Polish

**Files:**
- Create: `src/components/Toast.tsx`
- Modify: `src/newtab/App.tsx` (add toast)

- [ ] **Step 1: Create Toast.tsx**

```tsx
import { useEffect, useState } from 'react'

type ToastProps = {
  message: string
  duration?: number
}

/** Auto-dismissing toast notification */
export function Toast({ message, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-700 px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  )
}
```

- [ ] **Step 2: Add welcome toast to App.tsx**

In `App.tsx`, add state and render the toast after first-run import:

Add to the imports:
```tsx
import { Toast } from '@/components/Toast'
```

Add state:
```tsx
const [showWelcome, setShowWelcome] = useState(false)
```

In the `init()` function, after `await storageSet('initialized', true)`:
```tsx
setShowWelcome(true)
```

Add before the closing `</div>` of the root:
```tsx
{showWelcome && (
  <Toast message="Welcome! Press Ctrl+K to search, drag to reorder, right-click for options." duration={8000} />
)}
```

- [ ] **Step 3: Add .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
.superpowers/
*.log
```

- [ ] **Step 4: Run full test suite**

```bash
cd /e/projects/my-projects/bookmarks-manager
yarn vitest run
```

Expected: All tests PASS

- [ ] **Step 5: Run build**

```bash
yarn build
```

Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add welcome toast and finalize project"
```

---

## Loading the Extension in Chrome

After building, the extension can be loaded in Chrome for testing:

1. Run `yarn build` — outputs to `dist/`
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `dist/` folder
6. Open a new tab — the bookmarks manager should appear

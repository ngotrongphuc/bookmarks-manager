# Bookmarks Manager

A Chrome extension that replaces your new tab page with a visual speed dial bookmarks manager.

## Features

- **Visual bookmarks grid** — bookmarks displayed as cards with favicons/thumbnails
- **Folder navigation** — click folders to drill into them, breadcrumb to navigate back
- **Drag and drop** — reorder bookmarks by dragging
- **Command palette** — press `Ctrl+K` to search all bookmarks across folders
- **Thumbnail capture** — auto-capture page screenshots or upload custom images
- **Right-click menus** — add, edit, delete bookmarks and folders
- **Customizable** — background color/image, card style (backdrop color, blur, opacity, border radius), font, grid size, columns, gap
- **Real-time sync** — stays in sync with Chrome's native bookmarks (Ctrl+D, bookmark bar, etc.)

## Install from source

### Prerequisites

- Node.js 18+
- Yarn v4

### Build

```bash
git clone https://github.com/ngotrongphuc/bookmarks-manager.git
cd bookmarks-manager
yarn install
yarn build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Open a new tab

## Development

```bash
yarn dev
```

This starts Vite with HMR. Changes auto-reload in the browser.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open search (command palette) |

## Tech stack

React, TypeScript, Vite, CRXJS, Tailwind CSS, Zustand, @dnd-kit

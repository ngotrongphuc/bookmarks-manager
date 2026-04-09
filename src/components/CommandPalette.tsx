import { useState, useRef, useEffect, useMemo } from 'react'
import type { EnrichedBookmark } from '@/types'

type CommandPaletteProps = {
  bookmarks: EnrichedBookmark[]
  onClose: () => void
  onEdit: (chromeId: string) => void
  onDelete: (chromeId: string) => void
}

/** Ctrl+K command palette for global bookmark search */
export function CommandPalette({ bookmarks, onClose, onEdit, onDelete }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    if (!query.trim()) return bookmarks.slice(0, 20)
    const q = query.toLowerCase()
    return bookmarks
      .filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase(); const bTitle = b.title.toLowerCase()
        if (aTitle === q && bTitle !== q) return -1
        if (aTitle !== q && bTitle === q) return 1
        if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1
        if (!aTitle.startsWith(q) && bTitle.startsWith(q)) return 1
        return 0
      })
      .slice(0, 20)
  }, [bookmarks, query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { const s = results[selectedIndex]; if (s) window.open(s.url, '_self') }
  }

  function getDomain(url: string) { try { return new URL(url).hostname } catch { return url } }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input ref={inputRef} type="text" placeholder="Search all bookmarks..." value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }} onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-white/40 outline-none" />
          <kbd className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white/40">Esc</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 && <p className="px-4 py-8 text-center text-sm text-white/40">No bookmarks found</p>}
          {results.map((bookmark, index) => (
            <div key={bookmark.chromeId}
              className={`flex items-center gap-3 px-4 py-2 ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
              onMouseEnter={() => setSelectedIndex(index)}>
              <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`} alt="" className="h-5 w-5" />
              <a href={bookmark.url} className="flex-1 truncate">
                <span className="text-sm text-white">{bookmark.title}</span>
                <span className="ml-2 text-xs text-white/40">{getDomain(bookmark.url)}</span>
              </a>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); onEdit(bookmark.chromeId) }}
                  className="rounded p-1 text-white/30 hover:bg-white/10 hover:text-white/60" title="Edit">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(bookmark.chromeId) }}
                  className="rounded p-1 text-white/30 hover:bg-red-500/20 hover:text-red-400" title="Delete">
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

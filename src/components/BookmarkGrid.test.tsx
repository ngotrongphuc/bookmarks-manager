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
    cardStyle: 'rounded', cardOpacity: 0.9, gridSize: 'medium', columns: 4,
  }

  it('renders bookmark cards', () => {
    render(<BookmarkGrid bookmarks={bookmarks} settings={settings} onReorder={vi.fn()} onAddBookmark={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('GitHub')).toBeTruthy()
    expect(screen.getByText('Twitter')).toBeTruthy()
  })

  it('renders add bookmark card at the end', () => {
    render(<BookmarkGrid bookmarks={bookmarks} settings={settings} onReorder={vi.fn()} onAddBookmark={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('Add bookmark')).toBeTruthy()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookmarkGrid } from './BookmarkGrid'
import type { EnrichedBookmark, EnrichedFolder, Settings } from '@/types'

describe('BookmarkGrid', () => {
  const folders: EnrichedFolder[] = [
    { chromeId: '20', title: 'Dev', position: 0, icon: '🔧', bookmarkCount: 3 },
  ]
  const bookmarks: EnrichedBookmark[] = [
    { chromeId: '1', title: 'GitHub', url: 'https://github.com', position: 0, thumbnail: null, parentId: '10' },
    { chromeId: '2', title: 'Twitter', url: 'https://x.com', position: 1, thumbnail: null, parentId: '10' },
  ]
  const settings: Pick<Settings, 'cardStyle' | 'cardOpacity' | 'gridSize' | 'columns'> = {
    cardStyle: 'rounded', cardOpacity: 0.9, gridSize: 'medium', columns: 4,
  }

  const defaultProps = {
    folders,
    bookmarks,
    settings,
    onReorder: vi.fn(),
    onAddBookmark: vi.fn(),
    onOpenFolder: vi.fn(),
    onBookmarkContextMenu: vi.fn(),
    onFolderContextMenu: vi.fn(),
  }

  it('renders folder cards and bookmark cards', () => {
    render(<BookmarkGrid {...defaultProps} />)
    expect(screen.getByText('Dev')).toBeTruthy()
    expect(screen.getByText('GitHub')).toBeTruthy()
    expect(screen.getByText('Twitter')).toBeTruthy()
  })

  it('renders add bookmark card at the end', () => {
    render(<BookmarkGrid {...defaultProps} />)
    expect(screen.getByText('Add bookmark')).toBeTruthy()
  })
})

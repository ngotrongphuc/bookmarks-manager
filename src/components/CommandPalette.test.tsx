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
    render(<CommandPalette bookmarks={bookmarks} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search all bookmarks...')).toBeTruthy()
  })

  it('filters bookmarks by title', () => {
    render(<CommandPalette bookmarks={bookmarks} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Search all bookmarks...'), { target: { value: 'git' } })
    expect(screen.getByText('GitHub')).toBeTruthy()
    expect(screen.queryByText('Twitter')).toBeNull()
  })

  it('filters bookmarks by URL', () => {
    render(<CommandPalette bookmarks={bookmarks} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Search all bookmarks...'), { target: { value: 'x.com' } })
    expect(screen.getByText('Twitter')).toBeTruthy()
    expect(screen.queryByText('GitHub')).toBeNull()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<CommandPalette bookmarks={bookmarks} onClose={onClose} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.keyDown(screen.getByPlaceholderText('Search all bookmarks...'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

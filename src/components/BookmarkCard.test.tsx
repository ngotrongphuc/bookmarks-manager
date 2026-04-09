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

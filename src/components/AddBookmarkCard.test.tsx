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

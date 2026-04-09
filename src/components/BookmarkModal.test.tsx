import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookmarkModal } from './BookmarkModal'

describe('BookmarkModal', () => {
  const folders = [
    { chromeId: '1', title: 'Social' },
    { chromeId: '2', title: 'Work' },
  ]

  it('renders add mode with empty fields', () => {
    render(<BookmarkModal mode="add" folders={folders} currentFolderId="1" onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Add Bookmark')).toBeTruthy()
    expect(screen.getByPlaceholderText('Title')).toBeTruthy()
    expect(screen.getByPlaceholderText('URL')).toBeTruthy()
  })

  it('renders edit mode with pre-filled fields', () => {
    render(<BookmarkModal mode="edit" folders={folders} currentFolderId="1" initialTitle="GitHub" initialUrl="https://github.com" onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Edit Bookmark')).toBeTruthy()
    expect(screen.getByDisplayValue('GitHub')).toBeTruthy()
    expect(screen.getByDisplayValue('https://github.com')).toBeTruthy()
  })

  it('calls onSave with form data', () => {
    const onSave = vi.fn()
    render(<BookmarkModal mode="add" folders={folders} currentFolderId="1" onSave={onSave} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://test.com' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({ title: 'Test', url: 'https://test.com', folderId: '1', thumbnail: null })
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<BookmarkModal mode="add" folders={folders} currentFolderId="1" onSave={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

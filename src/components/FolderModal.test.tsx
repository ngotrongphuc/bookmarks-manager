import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FolderModal } from './FolderModal'

describe('FolderModal', () => {
  it('renders add mode', () => {
    render(<FolderModal mode="add" onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Add Folder')).toBeTruthy()
  })

  it('renders edit mode with pre-filled name', () => {
    render(<FolderModal mode="edit" initialName="Work" initialIcon="💼" onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Edit Folder')).toBeTruthy()
    expect(screen.getByDisplayValue('Work')).toBeTruthy()
  })

  it('calls onSave with folder data', () => {
    const onSave = vi.fn()
    render(<FolderModal mode="add" onSave={onSave} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Folder name'), { target: { value: 'Dev' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Dev' }))
  })
})

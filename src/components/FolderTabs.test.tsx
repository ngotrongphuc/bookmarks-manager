import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FolderTabs } from './FolderTabs'
import type { EnrichedFolder } from '@/types'

describe('FolderTabs', () => {
  const folders: EnrichedFolder[] = [
    { chromeId: '1', title: 'Social', position: 0, icon: '🌐', bookmarkCount: 5 },
    { chromeId: '2', title: 'Work', position: 1, icon: '💼', bookmarkCount: 3 },
  ]
  const defaultProps = {
    folders, activeFolderId: '1', accentColor: '#3b82f6',
    onSelectFolder: vi.fn(), onAddFolder: vi.fn(), onContextMenu: vi.fn(), onReorder: vi.fn(),
  }

  it('renders folder tabs', () => {
    render(<FolderTabs {...defaultProps} />)
    expect(screen.getByText('🌐 Social')).toBeTruthy()
    expect(screen.getByText('💼 Work')).toBeTruthy()
  })

  it('highlights active folder', () => {
    render(<FolderTabs {...defaultProps} />)
    const activeTab = screen.getByText('🌐 Social').closest('button')
    expect(activeTab?.className).toContain('border-b-2')
  })

  it('calls onSelectFolder when tab clicked', () => {
    const onSelect = vi.fn()
    render(<FolderTabs {...defaultProps} onSelectFolder={onSelect} />)
    fireEvent.click(screen.getByText('💼 Work'))
    expect(onSelect).toHaveBeenCalledWith('2')
  })

  it('renders add folder button', () => {
    render(<FolderTabs {...defaultProps} />)
    expect(screen.getByText('+')).toBeTruthy()
  })
})

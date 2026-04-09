import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders search and settings buttons', () => {
    render(<TopBar onOpenSearch={vi.fn()} onOpenSettings={vi.fn()} />)
    expect(screen.getByLabelText('Search')).toBeTruthy()
    expect(screen.getByLabelText('Settings')).toBeTruthy()
  })

  it('calls onOpenSearch when search clicked', () => {
    const onOpenSearch = vi.fn()
    render(<TopBar onOpenSearch={onOpenSearch} onOpenSettings={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(onOpenSearch).toHaveBeenCalledOnce()
  })

  it('calls onOpenSettings when settings clicked', () => {
    const onOpenSettings = vi.fn()
    render(<TopBar onOpenSearch={vi.fn()} onOpenSettings={onOpenSettings} />)
    fireEvent.click(screen.getByLabelText('Settings'))
    expect(onOpenSettings).toHaveBeenCalledOnce()
  })
})

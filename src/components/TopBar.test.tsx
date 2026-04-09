import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders search, grid toggle, and settings buttons', () => {
    render(<TopBar gridSize="medium" onOpenSearch={vi.fn()} onCycleGridSize={vi.fn()} onOpenSettings={vi.fn()} />)
    expect(screen.getByLabelText('Search')).toBeTruthy()
    expect(screen.getByLabelText('Grid size')).toBeTruthy()
    expect(screen.getByLabelText('Settings')).toBeTruthy()
  })

  it('calls onOpenSearch when search clicked', () => {
    const onOpenSearch = vi.fn()
    render(<TopBar gridSize="medium" onOpenSearch={onOpenSearch} onCycleGridSize={vi.fn()} onOpenSettings={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(onOpenSearch).toHaveBeenCalledOnce()
  })

  it('displays current grid size label', () => {
    render(<TopBar gridSize="large" onOpenSearch={vi.fn()} onCycleGridSize={vi.fn()} onOpenSettings={vi.fn()} />)
    expect(screen.getByText('L')).toBeTruthy()
  })
})

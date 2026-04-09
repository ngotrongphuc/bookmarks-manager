import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'

describe('ContextMenu', () => {
  const items = [
    { label: 'Open in new tab', action: vi.fn() },
    { label: 'Edit', action: vi.fn() },
    { label: 'Delete', action: vi.fn(), danger: true },
  ]

  it('renders menu items', () => {
    render(<ContextMenu x={100} y={100} items={items} onClose={vi.fn()} />)
    expect(screen.getByText('Open in new tab')).toBeTruthy()
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('calls action and closes on click', () => {
    const onClose = vi.fn()
    render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />)
    fireEvent.click(screen.getByText('Edit'))
    expect(items[1]!.action).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('positions at cursor coordinates', () => {
    const { container } = render(<ContextMenu x={200} y={300} items={items} onClose={vi.fn()} />)
    const menu = container.firstElementChild as HTMLElement
    expect(menu.style.left).toBe('200px')
    expect(menu.style.top).toBe('300px')
  })
})

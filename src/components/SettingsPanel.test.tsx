import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPanel } from './SettingsPanel'
import { DEFAULT_SETTINGS } from '@/types'

describe('SettingsPanel', () => {
  it('renders settings title', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('renders theme toggle', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Light')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()
  })

  it('renders card style options', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Rounded')).toBeTruthy()
    expect(screen.getByText('Sharp')).toBeTruthy()
    expect(screen.getByText('Glass')).toBeTruthy()
  })

  it('calls onUpdate when theme changes', () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={onUpdate} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Light'))
    expect(onUpdate).toHaveBeenCalledWith({ theme: 'light' })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalled()
  })
})

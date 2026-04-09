import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPanel } from './SettingsPanel'
import { DEFAULT_SETTINGS } from '@/types'

describe('SettingsPanel', () => {
  it('renders settings title', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('renders card style options', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Rounded')).toBeTruthy()
    expect(screen.getByText('Sharp')).toBeTruthy()
    expect(screen.getByText('Glass')).toBeTruthy()
  })

  it('calls onUpdate when card style changes', () => {
    const onUpdate = vi.fn()
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={onUpdate} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Sharp'))
    expect(onUpdate).toHaveBeenCalledWith({ cardStyle: 'sharp' })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders reset to defaults button', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Reset to defaults')).toBeTruthy()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPanel } from './SettingsPanel'
import { DEFAULT_SETTINGS } from '@/types'

describe('SettingsPanel', () => {
  it('renders settings title', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('renders card style controls', () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Card Style')).toBeTruthy()
    expect(screen.getByText(/Backdrop Color/)).toBeTruthy()
    expect(screen.getByText(/Border Radius/)).toBeTruthy()
    expect(screen.getByText(/Blur/)).toBeTruthy()
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

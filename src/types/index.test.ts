import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, GRID_SIZE_MAP } from './index'
import type { Settings } from './index'

describe('types', () => {
  it('DEFAULT_SETTINGS has all required fields', () => {
    const settings: Settings = DEFAULT_SETTINGS
    expect(settings.columns).toBe(6)
    expect(settings.background.type).toBe('color')
    expect(settings.cardBorderRadius).toBe(12)
    expect(settings.gridSize).toBe('medium')
  })

  it('GRID_SIZE_MAP has all sizes', () => {
    expect(GRID_SIZE_MAP.small.width).toBe(80)
    expect(GRID_SIZE_MAP.medium.width).toBe(120)
    expect(GRID_SIZE_MAP.large.width).toBe(180)
  })
})

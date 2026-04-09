import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, GRID_SIZE_MAP } from './index'
import type { Settings } from './index'

describe('types', () => {
  it('DEFAULT_SETTINGS has all required fields', () => {
    const settings: Settings = DEFAULT_SETTINGS
    expect(settings.theme).toBe('dark')
    expect(settings.columns).toBe(4)
    expect(settings.background.type).toBe('color')
    expect(settings.cardStyle).toBe('rounded')
    expect(settings.gridSize).toBe('medium')
  })

  it('GRID_SIZE_MAP has all sizes', () => {
    expect(GRID_SIZE_MAP.small.width).toBe(120)
    expect(GRID_SIZE_MAP.medium.width).toBe(180)
    expect(GRID_SIZE_MAP.large.width).toBe(240)
  })
})

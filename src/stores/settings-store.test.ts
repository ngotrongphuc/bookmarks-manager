import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsStore } from './settings-store'
import { DEFAULT_SETTINGS } from '@/types'

describe('settings-store', () => {
  beforeEach(() => {
    useSettingsStore.setState({ ...DEFAULT_SETTINGS, _initialized: false })
    vi.mocked(chrome.storage.local.get).mockReset()
    vi.mocked(chrome.storage.local.set).mockReset()
  })

  it('has default settings', () => {
    const state = useSettingsStore.getState()
    expect(state.columns).toBe(4)
    expect(state.cardBorderRadius).toBe(12)
    expect(state.gridSize).toBe('medium')
  })

  it('updateSettings merges partial settings', () => {
    useSettingsStore.getState().updateSettings({ columns: 6 })
    const state = useSettingsStore.getState()
    expect(state.columns).toBe(6)
    expect(state.cardBorderRadius).toBe(12)
  })

  it('loadSettings reads from chrome storage', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({
      settings: { ...DEFAULT_SETTINGS, columns: 6 },
    })
    await useSettingsStore.getState().loadSettings()
    expect(useSettingsStore.getState().columns).toBe(6)
  })
})

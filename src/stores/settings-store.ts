import { create } from 'zustand'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { storageGet, storageSet } from '@/lib/chrome-storage'

type SettingsState = Settings & {
  _initialized: boolean
  updateSettings: (partial: Partial<Settings>) => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  _initialized: false,

  updateSettings: (partial) => {
    set(partial)
    const { updateSettings, loadSettings, _initialized, ...settings } = get()
    storageSet('settings', settings)
  },

  loadSettings: async () => {
    const saved = await storageGet<Settings | undefined>('settings')
    if (saved) {
      set({ ...saved, _initialized: true })
    } else {
      set({ _initialized: true })
    }
  },
}))

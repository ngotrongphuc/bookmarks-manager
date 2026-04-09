import { useSettingsStore } from '@/stores/settings-store'

/** Access settings store with selector for re-render optimization */
export function useSettings() {
  return useSettingsStore()
}

/** Access a single setting value */
export function useSetting<K extends keyof ReturnType<typeof useSettingsStore.getState>>(key: K) {
  return useSettingsStore((s) => s[key])
}

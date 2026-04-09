/** Get a value from chrome.storage.local */
export async function storageGet<T>(key: string, defaultValue?: T): Promise<T> {
  const result = await chrome.storage.local.get(key)
  return (result[key] as T) ?? (defaultValue as T)
}

/** Set a value in chrome.storage.local */
export async function storageSet<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

/** Remove a key from chrome.storage.local */
export async function storageRemove(key: string): Promise<void> {
  await chrome.storage.local.remove(key)
}

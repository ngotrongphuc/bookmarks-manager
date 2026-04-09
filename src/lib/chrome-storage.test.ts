import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storageGet, storageSet, storageRemove } from './chrome-storage'

describe('chrome-storage', () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockReset()
    vi.mocked(chrome.storage.local.set).mockReset()
    vi.mocked(chrome.storage.local.remove).mockReset()
  })

  it('storageGet returns value for key', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({
      bookmarks: { '1': { chromeId: '1', position: 0, thumbnail: null } },
    })
    const result = await storageGet('bookmarks')
    expect(result).toEqual({ '1': { chromeId: '1', position: 0, thumbnail: null } })
  })

  it('storageGet returns defaultValue when key missing', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({})
    const result = await storageGet('bookmarks', {})
    expect(result).toEqual({})
  })

  it('storageSet persists key-value pair', async () => {
    vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)
    await storageSet('settings', { theme: 'dark' })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: { theme: 'dark' } })
  })

  it('storageRemove removes key', async () => {
    vi.mocked(chrome.storage.local.remove).mockResolvedValue(undefined)
    await storageRemove('bookmarks')
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('bookmarks')
  })
})

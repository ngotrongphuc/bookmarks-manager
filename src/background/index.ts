// Listen for thumbnail capture requests from the new tab page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'capture-thumbnail') {
    captureThumbnail(message.url)
      .then((data) => sendResponse({ data }))
      .catch(() => sendResponse({ data: null }))
    return true // keep message channel open for async response
  }
})

// Sync bookmarks when user modifies them via Chrome's native UI
chrome.bookmarks.onCreated.addListener((_id, bookmark) => {
  notifyNewTab({ type: 'bookmark-created', bookmark })
})

chrome.bookmarks.onRemoved.addListener((id) => {
  notifyNewTab({ type: 'bookmark-removed', id })
})

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  notifyNewTab({ type: 'bookmark-changed', id, changeInfo })
})

chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
  notifyNewTab({ type: 'bookmark-moved', id, moveInfo })
})

async function captureThumbnail(url: string): Promise<string | null> {
  let tab: chrome.tabs.Tab | null = null
  try {
    tab = await chrome.tabs.create({ url, active: true })

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener)
        reject(new Error('Timeout'))
      }, 15000)

      function listener(tabId: number, info: chrome.tabs.TabChangeInfo) {
        if (tabId === tab!.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener)
          clearTimeout(timeout)
          setTimeout(resolve, 1500)
        }
      }
      chrome.tabs.onUpdated.addListener(listener)
    })

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId!, { format: 'jpeg', quality: 70 })
    return dataUrl
  } catch {
    return null
  } finally {
    if (tab?.id) {
      chrome.tabs.remove(tab.id).catch(() => {})
    }
  }
}

function notifyNewTab(message: Record<string, unknown>) {
  chrome.runtime.sendMessage(message).catch(() => {})
}

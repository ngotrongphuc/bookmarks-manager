/** Extract domain from a URL */
export function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

/** Get Google favicon service URL for a site */
export function getFaviconUrl(url: string): string {
  const domain = getDomain(url)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

/** Request thumbnail capture from the background service worker */
export async function requestThumbnailCapture(url: string): Promise<string | null> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'capture-thumbnail', url })
    return response?.data ?? null
  } catch { return null }
}

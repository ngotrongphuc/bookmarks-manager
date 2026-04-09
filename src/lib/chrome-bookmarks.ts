/** Get the full Chrome bookmarks tree */
export async function getBookmarkTree() {
  return chrome.bookmarks.getTree()
}

/** Get the Bookmarks Bar folder node */
export async function getBookmarksBar() {
  const tree = await chrome.bookmarks.getTree()
  const root = tree[0]
  return root?.children?.find(
    (node) => node.title === 'Bookmarks Bar' || node.title === 'Bookmarks bar',
  ) ?? null
}

/** Get direct children of the Bookmarks Bar folder */
export async function getBookmarksBarChildren() {
  const bar = await getBookmarksBar()
  return bar?.children ?? []
}

/** Create a new bookmark in a folder */
export async function createBookmark(
  title: string,
  url: string,
  parentId: string,
) {
  return chrome.bookmarks.create({ parentId, title, url })
}

/** Create a new folder */
export async function createFolder(title: string, parentId: string) {
  return chrome.bookmarks.create({ parentId, title })
}

/** Update a bookmark's title and/or URL */
export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string },
) {
  return chrome.bookmarks.update(id, changes)
}

/** Delete a bookmark or folder */
export async function removeBookmark(id: string) {
  return chrome.bookmarks.remove(id)
}

/** Move a bookmark to a different folder */
export async function moveBookmark(
  id: string,
  destination: { parentId?: string; index?: number },
) {
  return chrome.bookmarks.move(id, destination)
}

/** Check if a bookmark node is a folder (no url property) */
export function isFolder(node: chrome.bookmarks.BookmarkTreeNode) {
  return !node.url
}

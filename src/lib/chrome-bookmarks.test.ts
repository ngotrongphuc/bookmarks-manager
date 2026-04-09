import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getBookmarkTree,
  getBookmarksBarChildren,
  createBookmark,
  removeBookmark,
  createFolder,
} from './chrome-bookmarks'

const mockTree: chrome.bookmarks.BookmarkTreeNode[] = [
  {
    id: '0',
    title: '',
    children: [
      {
        id: '1',
        title: 'Bookmarks Bar',
        children: [
          { id: '10', title: 'GitHub', url: 'https://github.com', parentId: '1' },
          {
            id: '20',
            title: 'Dev',
            children: [
              { id: '21', title: 'MDN', url: 'https://developer.mozilla.org', parentId: '20' },
            ],
          },
        ],
      },
      { id: '2', title: 'Other Bookmarks', children: [] },
    ],
  },
]

describe('chrome-bookmarks', () => {
  beforeEach(() => {
    vi.mocked(chrome.bookmarks.getTree).mockReset()
    vi.mocked(chrome.bookmarks.create).mockReset()
    vi.mocked(chrome.bookmarks.remove).mockReset()
  })

  it('getBookmarkTree returns full tree', async () => {
    vi.mocked(chrome.bookmarks.getTree).mockResolvedValue(mockTree)
    const tree = await getBookmarkTree()
    expect(tree[0]?.id).toBe('0')
  })

  it('getBookmarksBarChildren returns bar children', async () => {
    vi.mocked(chrome.bookmarks.getTree).mockResolvedValue(mockTree)
    const children = await getBookmarksBarChildren()
    expect(children).toHaveLength(2)
    expect(children[0]?.title).toBe('GitHub')
  })

  it('createBookmark calls chrome.bookmarks.create', async () => {
    vi.mocked(chrome.bookmarks.create).mockResolvedValue({
      id: '30', title: 'New', url: 'https://new.com',
    })
    const result = await createBookmark('New', 'https://new.com', '1')
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '1', title: 'New', url: 'https://new.com',
    })
    expect(result.id).toBe('30')
  })

  it('createFolder calls chrome.bookmarks.create without url', async () => {
    vi.mocked(chrome.bookmarks.create).mockResolvedValue({ id: '40', title: 'Work' })
    const result = await createFolder('Work', '1')
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({ parentId: '1', title: 'Work' })
    expect(result.id).toBe('40')
  })

  it('removeBookmark calls chrome.bookmarks.remove', async () => {
    vi.mocked(chrome.bookmarks.remove).mockResolvedValue(undefined)
    await removeBookmark('10')
    expect(chrome.bookmarks.remove).toHaveBeenCalledWith('10')
  })
})

import { describe, it, expect } from 'vitest'
import { getFaviconUrl, getDomain } from './thumbnail'

describe('thumbnail utils', () => {
  it('getFaviconUrl returns google favicon service URL', () => {
    const url = getFaviconUrl('https://github.com')
    expect(url).toBe('https://www.google.com/s2/favicons?domain=github.com&sz=64')
  })

  it('getDomain extracts hostname', () => {
    expect(getDomain('https://github.com/anthropics')).toBe('github.com')
    expect(getDomain('https://www.google.com/search?q=test')).toBe('www.google.com')
  })

  it('getDomain handles invalid URL gracefully', () => {
    expect(getDomain('not-a-url')).toBe('not-a-url')
  })
})

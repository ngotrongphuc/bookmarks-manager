import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BackgroundLayer } from './BackgroundLayer'

describe('BackgroundLayer', () => {
  it('renders solid color background', () => {
    const { container } = render(
      <BackgroundLayer background={{ type: 'color', value: '#0f172a' }} />,
    )
    const layer = container.firstElementChild as HTMLElement
    expect(layer.style.backgroundColor).toBe('rgb(15, 23, 42)')
  })

  it('renders image background', () => {
    const { container } = render(
      <BackgroundLayer background={{ type: 'image', value: 'https://example.com/bg.jpg' }} />,
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.src).toBe('https://example.com/bg.jpg')
  })
})

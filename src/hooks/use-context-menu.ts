import { useState, useCallback } from 'react'
import type { ContextMenuItem } from '@/components/ContextMenu'

type ContextMenuState = {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

/** Hook for managing right-click context menu state */
export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, items: [] })
  const show = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault()
    setMenu({ visible: true, x: e.clientX, y: e.clientY, items })
  }, [])
  const hide = useCallback(() => { setMenu((prev) => ({ ...prev, visible: false })) }, [])
  return { menu, show, hide }
}

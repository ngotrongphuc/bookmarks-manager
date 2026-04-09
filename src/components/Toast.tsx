import { useEffect, useState } from 'react'

type ToastProps = {
  message: string
  duration?: number
}

/** Auto-dismissing toast notification */
export function Toast({ message, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-700 px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  )
}

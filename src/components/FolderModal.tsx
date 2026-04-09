import { useState } from 'react'

const EMOJI_OPTIONS = ['📁', '💼', '🎮', '📰', '🛒', '🎵', '📚', '🔧', '🌐', '❤️', '⭐', '🏠']

type FolderModalProps = {
  mode: 'add' | 'edit'
  initialName?: string
  initialIcon?: string
  initialColor?: string
  onSave: (data: { name: string; icon: string; color: string }) => void
  onClose: () => void
}

/** Modal form for adding or editing a folder */
export function FolderModal({ mode, initialName = '', initialIcon = '📁', initialColor = '#3b82f6', onSave, onClose }: FolderModalProps) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), icon, color })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">{mode === 'add' ? 'Add Folder' : 'Edit Folder'}</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Folder name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500" />
          <div>
            <label className="mb-2 block text-sm text-white/60">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} onClick={() => setIcon(emoji)}
                  className={`rounded-lg p-2 text-xl transition-colors ${icon === emoji ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/60">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg bg-slate-700" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Save</button>
        </div>
      </div>
    </div>
  )
}

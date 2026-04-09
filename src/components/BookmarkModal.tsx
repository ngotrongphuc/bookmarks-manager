import { useState, useRef } from 'react'

type BookmarkModalProps = {
  mode: 'add' | 'edit'
  folders: Array<{ chromeId: string; title: string }>
  currentFolderId: string
  initialTitle?: string
  initialUrl?: string
  initialThumbnail?: string | null
  onSave: (data: { title: string; url: string; folderId: string; thumbnail: string | null }) => void
  onClose: () => void
  onCaptureThumbnail?: (url: string) => Promise<string | null>
}

/** Modal form for adding or editing a bookmark */
export function BookmarkModal({
  mode, folders, currentFolderId, initialTitle = '', initialUrl = '',
  initialThumbnail = null, onSave, onClose, onCaptureThumbnail,
}: BookmarkModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [url, setUrl] = useState(initialUrl)
  const [folderId, setFolderId] = useState(currentFolderId)
  const [thumbnail, setThumbnail] = useState<string | null>(initialThumbnail)
  const [capturing, setCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    if (!title.trim() || !url.trim()) return
    onSave({ title: title.trim(), url: url.trim(), folderId, thumbnail })
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setThumbnail(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCapture() {
    if (!onCaptureThumbnail || !url.trim()) return
    setCapturing(true)
    const result = await onCaptureThumbnail(url.trim())
    setThumbnail(result)
    setCapturing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {mode === 'add' ? 'Add Bookmark' : 'Edit Bookmark'}
        </h2>
        <div className="space-y-4">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={folderId} onChange={(e) => setFolderId(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500">
            {folders.map((f) => (<option key={f.chromeId} value={f.chromeId}>{f.title}</option>))}
          </select>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Thumbnail</label>
            {thumbnail && <img src={thumbnail} alt="Thumbnail preview" className="h-24 w-full rounded-lg object-cover" />}
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white/80 hover:bg-slate-600">Upload</button>
              {onCaptureThumbnail && (
                <button type="button" onClick={handleCapture} disabled={capturing}
                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white/80 hover:bg-slate-600 disabled:opacity-50">
                  {capturing ? 'Capturing...' : 'Capture'}
                </button>
              )}
              {thumbnail && (
                <button type="button" onClick={() => setThumbnail(null)}
                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-red-400 hover:bg-slate-600">Remove</button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
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

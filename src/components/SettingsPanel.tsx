import { useRef } from 'react'
import { cn } from '@/lib/cn'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const FONT_OPTIONS = [
  { label: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", Tahoma, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
]

/** Extract hex color from rgba string */
function rgbaToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return '#ffffff'
  const [, r, g, b] = match
  return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`
}

/** Extract alpha from rgba string */
function rgbaAlpha(rgba: string): number {
  const match = rgba.match(/rgba?\(\d+,\s*\d+,\s*\d+,?\s*([\d.]+)?\)/)
  return match?.[1] != null ? Number(match[1]) : 1
}

/** Convert hex + alpha to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type SettingsPanelProps = {
  settings: Settings
  onUpdate: (partial: Partial<Settings>) => void
  onClose: () => void
  onBackgroundImageUpload?: (dataUrl: string) => void
}

/** Slide-out settings panel from the right */
export function SettingsPanel({ settings, onUpdate, onClose, onBackgroundImageUpload }: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      onUpdate({ background: { type: 'image', value: dataUrl } })
      onBackgroundImageUpload?.(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[300px] overflow-y-auto border-l border-white/10 bg-slate-900 p-5 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <button aria-label="Close settings" onClick={onClose}
          className="rounded-lg p-1 text-white/40 hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-6">
        <Section title="Background">
          <div className="flex gap-2">
            {(['color', 'gradient', 'image'] as const).map((type) => (
              <button key={type} onClick={() => {
                if (type === 'color') onUpdate({ background: { type, value: '#0f172a' } })
                if (type === 'gradient') onUpdate({ background: { type, value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } })
                if (type === 'image') fileInputRef.current?.click()
              }} className={cn('rounded-lg px-3 py-1.5 text-xs capitalize',
                settings.background.type === type ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white/60 hover:text-white')}>
                {type}
              </button>
            ))}
          </div>
          {settings.background.type === 'color' && (
            <input type="color" value={settings.background.value}
              onChange={(e) => onUpdate({ background: { type: 'color', value: e.target.value } })}
              className="mt-2 h-8 w-full cursor-pointer rounded bg-slate-700" />
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </Section>

        <Section title="Card Style">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Backdrop Color</label>
              <input type="color" value={rgbaToHex(settings.cardBackdropColor)}
                onChange={(e) => {
                  const alpha = rgbaAlpha(settings.cardBackdropColor)
                  onUpdate({ cardBackdropColor: hexToRgba(e.target.value, alpha) })
                }}
                className="h-8 w-full cursor-pointer rounded bg-slate-700" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Backdrop Opacity — {Math.round(rgbaAlpha(settings.cardBackdropColor) * 100)}%</label>
              <input type="range" min={0} max={1} step={0.05}
                value={rgbaAlpha(settings.cardBackdropColor)}
                onChange={(e) => {
                  const hex = rgbaToHex(settings.cardBackdropColor)
                  onUpdate({ cardBackdropColor: hexToRgba(hex, Number(e.target.value)) })
                }}
                className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Card Opacity — {Math.round(settings.cardOpacity * 100)}%</label>
              <input type="range" min={0} max={1} step={0.05} value={settings.cardOpacity}
                onChange={(e) => onUpdate({ cardOpacity: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Border Radius — {settings.cardBorderRadius}px</label>
              <input type="range" min={0} max={24} step={2} value={settings.cardBorderRadius}
                onChange={(e) => onUpdate({ cardBorderRadius: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Blur — {settings.cardBlur}px</label>
              <input type="range" min={0} max={24} step={2} value={settings.cardBlur}
                onChange={(e) => onUpdate({ cardBlur: Number(e.target.value) })} className="w-full" />
            </div>
          </div>
        </Section>

        <Section title="Font">
          <select value={settings.fontFamily} onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-white outline-none">
            {FONT_OPTIONS.map((font) => (<option key={font.label} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>))}
          </select>
        </Section>

        <Section title="Grid Size">
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button key={size} onClick={() => onUpdate({ gridSize: size })}
                className={cn('flex-1 rounded-lg py-1.5 text-sm',
                  settings.gridSize === size ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white/60 hover:text-white')}>
                {size[0]?.toUpperCase()}
              </button>
            ))}
          </div>
        </Section>

        <Section title={`Columns — ${settings.columns}`}>
          <input type="range" min={3} max={8} step={1} value={settings.columns}
            onChange={(e) => onUpdate({ columns: Number(e.target.value) })} className="w-full" />
        </Section>

        <Section title={`Gap — ${settings.gap}px`}>
          <input type="range" min={0} max={48} step={4} value={settings.gap}
            onChange={(e) => onUpdate({ gap: Number(e.target.value) })} className="w-full" />
        </Section>

        {/* Keyboard Shortcuts */}
        <Section title="Keyboard Shortcuts">
          <div className="space-y-2 text-sm text-white/50">
            <div className="flex items-center justify-between">
              <span>Search bookmarks</span>
              <kbd className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white/60">Ctrl+K</kbd>
            </div>
          </div>
        </Section>

        {/* Reset */}
        <button
          onClick={() => onUpdate(DEFAULT_SETTINGS)}
          className="w-full rounded-lg border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase text-white/40">{title}</label>
      {children}
    </div>
  )
}

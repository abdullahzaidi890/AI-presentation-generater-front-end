import { bgCss } from '../themes'
import type { Theme } from '../types/schema'

export function ThemePicker({ themes, value, onChange }: { themes: Theme[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {themes.map((t) => (
        <button
          key={t.id} type="button" role="radio" aria-checked={value === t.id} onClick={() => onChange(t.id)}
          className={`rounded-lg border-2 p-1.5 text-left ${value === t.id ? 'border-brand-600' : 'border-slate-200 hover:border-slate-400'}`}
        >
          <div style={{ background: bgCss(t) }} className="flex h-10 items-end gap-1 rounded p-1.5">
            <span style={{ background: t.title }} className="h-1.5 w-6 rounded" />
            <span style={{ background: t.accent }} className="h-1.5 w-3 rounded" />
          </div>
          <span className="mt-1 block text-xs font-medium text-slate-800">{t.name}</span>
        </button>
      ))}
    </div>
  )
}

import { Copy, Cpu, FilePlus2, Layers, Pencil, Presentation, Search, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog, Dialog } from '../components/Dialog'
import { Skeleton } from '../components/Skeleton'
import { SlideView } from '../components/SlideView'
import { useToast } from '../components/Toast'
import { api } from '../lib/api'
import { useThemes } from '../lib/useThemes'
import type { PresentationSummary, Stats } from '../types/schema'

const BADGE: Record<string, string> = {
  groq: 'bg-orange-50 text-orange-800 ring-orange-200', gemini: 'bg-sky-50 text-sky-800 ring-sky-200',
  claude: 'bg-amber-50 text-amber-900 ring-amber-200', xai: 'bg-zinc-100 text-zinc-800 ring-zinc-300',
  mock: 'bg-slate-100 text-slate-800 ring-slate-300',
}

export function Dashboard() {
  const toast = useToast()
  const nav = useNavigate()
  const { byId } = useThemes()
  const [items, setItems] = useState<PresentationSummary[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [q, setQ] = useState('')
  const [provider, setProvider] = useState('')
  const [toDelete, setToDelete] = useState<PresentationSummary | null>(null)
  const [toRename, setToRename] = useState<PresentationSummary | null>(null)
  const [newName, setNewName] = useState('')

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([api.list(q, provider), api.stats()])
      setItems(l); setStats(s)
    } catch (e) {
      setItems([]); toast('error', e instanceof Error ? e.message : 'Could not load presentations.')
    }
  }, [q, provider, toast])

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load])

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast('success', ok); load() } catch (e) { toast('error', e instanceof Error ? e.message : 'Action failed.') }
  }

  const statCards = [
    { label: 'Presentations', value: stats?.presentations, icon: <Presentation className="h-5 w-5" />, tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Total slides', value: stats?.slides, icon: <Layers className="h-5 w-5" />, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Providers used', value: stats?.providers_used, icon: <Cpu className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 p-8 text-white shadow-xl shadow-brand-600/20 md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-violet-400/20" aria-hidden="true" />
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium"><Sparkles className="h-3.5 w-3.5" />AI-powered slides</p>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">Create beautiful presentations in minutes</h1>
        <p className="mt-3 max-w-xl text-indigo-50">Give a topic or upload a document. Edit the slides, check the quality, then export to PowerPoint or PDF.</p>
        <Link to="/create" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-lg hover:bg-indigo-50">
          <FilePlus2 className="h-4 w-4" />New presentation
        </Link>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {statCards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4 p-5">
            <span className={`rounded-xl p-3 ${c.tone}`}>{c.icon}</span>
            <div>
              <p className="text-sm text-slate-700">{c.label}</p>
              {stats ? <p className="text-2xl font-bold text-slate-900">{c.value}</p> : <Skeleton className="mt-1 h-8 w-12" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-xl font-semibold text-slate-900">Your presentations</h2>
        <div className="relative w-full min-w-60 sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
          <label htmlFor="search" className="sr-only">Search presentations</label>
          <input id="search" className="input pl-10" placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pf" className="sr-only">Filter by provider</label>
          <select id="pf" className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="">All providers</option>
            {['groq', 'gemini', 'claude', 'xai', 'mock'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {items === null && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>}
      {items?.length === 0 && (
        <div className="card flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <span className="rounded-2xl bg-brand-50 p-4 text-brand-600"><Layers className="h-8 w-8" aria-hidden="true" /></span>
          <p className="text-lg font-semibold text-slate-900">{q || provider ? 'No presentations match your search.' : 'No presentations yet'}</p>
          {!q && !provider && <><p className="text-sm text-slate-700">Create your first deck in under a minute.</p><Link to="/create" className="btn-primary mt-1">Create your first presentation</Link></>}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((p) => (
          <article key={p.id} className="card card-hover flex flex-col overflow-hidden">
            <Link to={`/editor/${p.id}`} aria-label={`Open ${p.title}`} className="block bg-slate-100 p-3">
              {p.cover ? <SlideView slide={p.cover} theme={byId(p.theme)} className="overflow-hidden rounded-lg shadow-md ring-1 ring-black/5" /> : <div className="aspect-video rounded-lg bg-slate-200" />}
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <Link to={`/editor/${p.id}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-brand-700">{p.title}</Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ${BADGE[p.provider] ?? BADGE.mock}`}>{p.provider || 'manual'}{p.fallback_used ? ' (fallback)' : ''}</span>
                <span>{p.slide_count} slides</span><span aria-hidden="true">·</span><span>{new Date(p.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-auto flex gap-1.5 pt-4">
                <button className="btn-primary flex-1 py-2" onClick={() => nav(`/editor/${p.id}`)}>Open</button>
                <button className="btn-secondary px-2.5" aria-label={`Rename ${p.title}`} title="Rename" onClick={() => { setToRename(p); setNewName(p.title) }}><Pencil className="h-4 w-4" /></button>
                <button className="btn-secondary px-2.5" aria-label={`Duplicate ${p.title}`} title="Duplicate" onClick={() => act(() => api.duplicate(p.id), 'Duplicated.')}><Copy className="h-4 w-4" /></button>
                <button className="btn-secondary px-2.5 text-red-700" aria-label={`Delete ${p.title}`} title="Delete" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {toDelete && (
        <ConfirmDialog title="Delete presentation?" message={`“${toDelete.title}” will be permanently deleted.`} confirmLabel="Delete"
          onClose={() => setToDelete(null)} onConfirm={() => { const p = toDelete; setToDelete(null); act(() => api.remove(p.id), 'Deleted.') }} />
      )}
      {toRename && (
        <Dialog title="Rename presentation" onClose={() => setToRename(null)}>
          <label htmlFor="rn" className="label">Title</label>
          <input id="rn" className="input mb-4" value={newName} maxLength={200} autoFocus onChange={(e) => setNewName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setToRename(null)}>Cancel</button>
            <button className="btn-primary" disabled={!newName.trim()} onClick={() => { const p = toRename; setToRename(null); act(() => api.rename(p.id, newName.trim()), 'Renamed.') }}>Save</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

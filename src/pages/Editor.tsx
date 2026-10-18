import { ArrowDown, ArrowUp, Copy, Download, ExternalLink, FileText, Plus, RefreshCw, Save, Trash2, Wand2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/Dialog'
import { QualityPanel } from '../components/QualityPanel'
import { Skeleton } from '../components/Skeleton'
import { SlideView } from '../components/SlideView'
import { ThemePicker } from '../components/ThemePicker'
import { useToast } from '../components/Toast'
import { api } from '../lib/api'
import { isDeck, newSlide } from '../lib/schema'
import { useThemes } from '../lib/useThemes'
import { LAYOUTS, type Deck, type EvalReport, type GenSettings, type Presentation, type ProviderInfo, type Slide, type StreamEvent } from '../types/schema'

const LAYOUT_LABEL: Record<string, string> = {
  title: 'Title', bullets: 'Bullets', two_column: 'Two columns', quote: 'Quote', chart: 'Chart / visual', closing: 'Closing',
}

/** Remove empty lines/whitespace before saving so the server schema is happy. */
const clean = (d: Deck): Deck => ({
  ...d,
  slides: d.slides.map((s) => ({
    ...s, title: s.title.trim() || 'Untitled', bullets: s.bullets.map((b) => b.trim()).filter(Boolean),
    references: s.references.map((r) => r.trim()).filter(Boolean),
  })),
})

export function Editor() {
  const { id = '' } = useParams()
  const toast = useToast()
  const { themes, byId } = useThemes()
  const [pres, setPres] = useState<Presentation | null>(null)
  const [deck, setDeck] = useState<Deck | null>(null)
  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('minimal_academic')
  const [sel, setSel] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [regenProvider, setRegenProvider] = useState('mock')
  const [instruction, setInstruction] = useState('')
  const [regenBusy, setRegenBusy] = useState(false)
  const [confirmDeck, setConfirmDeck] = useState(false)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [report, setReport] = useState<EvalReport | null>(null)
  const [evalBusy, setEvalBusy] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    api.get(id).then((p) => {
      setPres(p); setDeck(p.content); setTitle(p.title); setTheme(p.theme)
    }).catch((e) => setLoadErr(e instanceof Error ? e.message : 'Could not load the presentation.'))
    api.providers().then(({ providers: ps }) => setProviders(ps)).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!pres || providers.length === 0) return
    const ok = providers.find((p) => p.id === pres.provider && p.configured)
    setRegenProvider(ok ? ok.id : providers.find((p) => p.configured)?.id ?? 'mock')
  }, [pres, providers])

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const slide = deck?.slides[sel]
  const themeObj = byId(theme)
  const edit = useCallback((fn: (d: Deck) => Deck) => { setDeck((d) => (d ? fn(d) : d)); setDirty(true); setReport(null) }, [])
  const patch = (p: Partial<Slide>) => edit((d) => ({ ...d, slides: d.slides.map((s, i) => (i === sel ? { ...s, ...p } : s)) }))

  const save = useCallback(async (): Promise<boolean> => {
    if (!deck) return false
    const cleaned = clean(deck)
    if (!isDeck(cleaned)) { toast('error', 'Some slide data is invalid (check title length and bullet count).'); return false }
    setSaving(true)
    try {
      const saved = await api.save(id, title.trim() || 'Untitled', cleaned, theme)
      setPres(saved); setDeck(saved.content); setDirty(false)
      toast('success', 'Saved.')
      return true
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Save failed.'); return false } finally { setSaving(false) }
  }, [deck, id, title, theme, toast])

  const move = (from: number, to: number) => {
    if (!deck || to < 0 || to >= deck.slides.length || from === to) return
    edit((d) => { const s = [...d.slides]; const [m] = s.splice(from, 1); s.splice(to, 0, m); return { ...d, slides: s } })
    setSel(to)
  }
  const add = () => { edit((d) => { const s = [...d.slides]; s.splice(sel + 1, 0, newSlide()); return { ...d, slides: s } }); setSel(sel + 1) }
  const duplicate = () => {
    if (!slide) return
    edit((d) => { const s = [...d.slides]; s.splice(sel + 1, 0, { ...slide, id: crypto.randomUUID() }); return { ...d, slides: s } }); setSel(sel + 1)
  }
  const remove = () => {
    if (!deck || deck.slides.length <= 1) { toast('error', 'A presentation needs at least one slide.'); return }
    edit((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== sel) })); setSel(Math.max(0, sel - 1))
  }

  const regenSlide = async () => {
    if (!deck || !slide) return
    setRegenBusy(true)
    try {
      const r = await api.regenSlide({
        deck_title: title, slide, instruction, provider: regenProvider, model: '', language: deck.language,
        other_titles: deck.slides.filter((_, i) => i !== sel).map((s) => s.title),
      })
      edit((d) => ({ ...d, slides: d.slides.map((s, i) => (i === sel ? r.slide : s)) }))
      r.notices.forEach((n) => toast('info', n))
      toast('success', `Slide regenerated by ${r.provider}. Review it, then save.`)
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Regeneration failed.') } finally { setRegenBusy(false) }
  }

  const regenDeck = async () => {
    setConfirmDeck(false)
    const s = pres?.settings
    if (!s?.topic) { toast('error', 'The original topic was not stored (document-based deck). Create a new presentation instead.'); return }
    setRegenBusy(true)
    const settings = { topic: s.topic, slides: s.slides ?? deck?.slides.length ?? 8, audience: s.audience ?? 'General audience', language: s.language ?? 'English',
      purpose: s.purpose ?? 'Inform', tone: s.tone ?? 'Professional', theme, detail: s.detail ?? 'standard', speaker_notes: s.speaker_notes ?? true,
      provider: regenProvider, model: providers.find((p) => p.id === regenProvider)?.models[0] ?? '' } as GenSettings
    let outcome: StreamEvent | null = null
    try {
      await api.generate(settings, null, (ev) => { if ('done' in ev || 'error' in ev) outcome = ev })
      const ev = outcome as StreamEvent | null
      if (ev && 'done' in ev) {
        const fresh = ev.presentation
        api.remove(fresh.id).catch(() => {}) // the new row was only a carrier for the generated deck
        edit(() => fresh.content); setSel(0)
        ev.notices.forEach((n) => toast('info', n))
        toast('success', `Deck regenerated by ${ev.provider}. Review it, then save.`)
      } else toast('error', ev && 'error' in ev ? ev.error : 'Regeneration failed.')
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Regeneration failed.') } finally { setRegenBusy(false) }
  }

  const exportAs = async (kind: 'pptx' | 'pdf') => {
    if (dirty && !(await save())) return
    setExporting(kind)
    const err = await api.download(id, kind, title)
    setExporting('')
    toast(err ? 'error' : 'success', err ?? `${kind.toUpperCase()} downloaded.`)
  }

  const runEval = async (ai: boolean) => {
    if (dirty && !(await save())) return
    setEvalBusy(true)
    try { setReport(await api.evaluate(id, ai, regenProvider)) } catch (e) { toast('error', e instanceof Error ? e.message : 'Evaluation failed.') } finally { setEvalBusy(false) }
  }

  const configured = useMemo(() => providers.filter((p) => p.configured), [providers])

  if (loadErr) return <p role="alert" className="err">{loadErr}</p>
  if (!deck || !slide || !pres) return <div className="grid gap-4 md:grid-cols-[14rem_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="card sticky top-2 z-20 flex flex-wrap items-center gap-3 bg-white/95 p-3 shadow-md backdrop-blur">
        <label htmlFor="title" className="sr-only">Presentation title</label>
        <input id="title" className="input max-w-md flex-1 font-semibold" value={title} maxLength={200} onChange={(e) => { setTitle(e.target.value); setDirty(true) }} />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800" title="Provider that produced the original result">
          {pres.provider ? `Generated by ${pres.provider} · ${pres.model}` : 'Created manually'}
        </span>
        {pres.fallback_used && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">Fallback provider was used</span>}
        {dirty && <span className="text-xs font-medium text-amber-800">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn-primary" onClick={save} disabled={saving || !dirty}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}</button>
          <button className="btn-secondary" onClick={() => exportAs('pptx')} disabled={!!exporting}><Download className="h-4 w-4" />{exporting === 'pptx' ? 'Exporting…' : 'PPTX'}</button>
          <button className="btn-secondary" onClick={() => exportAs('pdf')} disabled={!!exporting}><FileText className="h-4 w-4" />{exporting === 'pdf' ? 'Exporting…' : 'PDF'}</button>
          <a className="btn-secondary" href={`/print/${id}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Print view</a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
        <aside aria-label="Slides" className="card max-h-[70vh] space-y-2 overflow-y-auto p-2">
          {deck.slides.map((s, i) => (
            <div key={s.id} draggable onDragStart={() => setDragFrom(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null) }}
              className={`rounded-xl border-2 p-1 ${i === sel ? 'border-brand-600 bg-brand-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}>
              <button className="block w-full text-left" onClick={() => setSel(i)} aria-label={`Select slide ${i + 1}: ${s.title}`} aria-current={i === sel}>
                <SlideView slide={s} theme={themeObj} />
                <span className="mt-1 block truncate px-1 text-xs text-slate-800">{i + 1}. {s.title}</span>
              </button>
              {i === sel && (
                <div className="mt-1 flex justify-center gap-1">
                  <button className="btn-secondary px-2 py-1" aria-label="Move slide up" onClick={() => move(i, i - 1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button className="btn-secondary px-2 py-1" aria-label="Move slide down" onClick={() => move(i, i + 1)} disabled={i === deck.slides.length - 1}><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-xl md:p-8">
            <SlideView slide={slide} theme={themeObj} className="overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10" />
          </div>
          <section className="card space-y-3 p-4" aria-label="Edit slide">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto font-semibold">Slide {sel + 1} of {deck.slides.length}</h2>
              <button className="btn-secondary" onClick={add}><Plus className="h-4 w-4" />Add</button>
              <button className="btn-secondary" onClick={duplicate}><Copy className="h-4 w-4" />Duplicate</button>
              <button className="btn-secondary text-red-700" onClick={remove}><Trash2 className="h-4 w-4" />Delete</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div>
                <label htmlFor="st" className="label">Slide title</label>
                <input id="st" className="input" value={slide.title} maxLength={200} onChange={(e) => patch({ title: e.target.value })} />
              </div>
              <div>
                <label htmlFor="sl" className="label">Layout</label>
                <select id="sl" className="input" value={slide.layout} onChange={(e) => patch({ layout: e.target.value as Slide['layout'] })}>
                  {LAYOUTS.map((l) => <option key={l} value={l}>{LAYOUT_LABEL[l]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="sb" className="label">Bullets (one per line)</label>
              <textarea id="sb" className="input min-h-28" value={slide.bullets.join('\n')} onChange={(e) => patch({ bullets: e.target.value.split('\n') })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sn" className="label">Speaker notes</label>
                <textarea id="sn" className="input min-h-24" value={slide.speaker_notes} onChange={(e) => patch({ speaker_notes: e.target.value })} />
              </div>
              <div>
                <label htmlFor="sv" className="label">Visual suggestion</label>
                <textarea id="sv" className="input min-h-24" value={slide.visual_suggestion} onChange={(e) => patch({ visual_suggestion: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="sr" className="label">References (one per line, optional)</label>
              <textarea id="sr" className="input" rows={2} value={slide.references.join('\n')} onChange={(e) => patch({ references: e.target.value.split('\n') })} />
            </div>
          </section>

          <section className="card space-y-3 p-4" aria-label="AI regeneration">
            <h2 className="font-semibold">Regenerate with AI</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div>
                <label htmlFor="ri" className="label">Instruction for this slide (optional)</label>
                <input id="ri" className="input" value={instruction} maxLength={500} placeholder="e.g. make it simpler and add an example" onChange={(e) => setInstruction(e.target.value)} />
              </div>
              <div>
                <label htmlFor="rp" className="label">Provider</label>
                <select id="rp" className="input" value={regenProvider} onChange={(e) => setRegenProvider(e.target.value)}>
                  {configured.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={regenSlide} disabled={regenBusy}><Wand2 className="h-4 w-4" />{regenBusy ? 'Working…' : 'Regenerate this slide'}</button>
              <button className="btn-secondary" onClick={() => setConfirmDeck(true)} disabled={regenBusy || !pres.settings?.topic}
                title={pres.settings?.topic ? 'Generate the whole deck again from the saved topic' : 'Not available: the original document is not stored'}>
                <RefreshCw className="h-4 w-4" />Regenerate whole deck
              </button>
            </div>
          </section>

          <section className="card space-y-2 p-4" aria-label="Theme">
            <h2 className="font-semibold">Theme</h2>
            <ThemePicker themes={themes} value={theme} onChange={(t) => { setTheme(t); setDirty(true) }} />
          </section>
          <QualityPanel report={report} loading={evalBusy} onRun={() => runEval(false)} onRunAi={() => runEval(true)} />
        </div>
      </div>
      {confirmDeck && (
        <ConfirmDialog title="Regenerate the whole deck?" message="Your current slides will be replaced by a new deck (you can still decide not to save)." confirmLabel="Regenerate"
          onConfirm={regenDeck} onClose={() => setConfirmDeck(false)} />
      )}
    </div>
  )
}

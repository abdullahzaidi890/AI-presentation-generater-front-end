import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProviderSelect } from '../components/ProviderSelect'
import { ThemePicker } from '../components/ThemePicker'
import { useToast } from '../components/Toast'
import { api } from '../lib/api'
import { useThemes } from '../lib/useThemes'
import { hasErrors, validateCreateForm, validateFile, type FormErrors } from '../lib/validation'
import type { Attempt, GenSettings, ProviderInfo, StreamEvent } from '../types/schema'

const INITIAL: GenSettings = {
  topic: '', slides: 8, audience: 'General audience', language: 'English', purpose: 'Inform', tone: 'Professional',
  theme: 'minimal_academic', detail: 'standard', speaker_notes: true, provider: 'mock', model: 'mock-1',
}
const STEP_LABEL: Record<string, string> = {
  reading: 'Reading document', generating: 'Generating slides', retrying: 'Retrying once (invalid output)', validating: 'Validating structure', saving: 'Saving',
}

function Head({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-violet-600 text-sm font-semibold text-white shadow">{n}</span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {hint && <p className="text-sm text-slate-700">{hint}</p>}
      </div>
    </div>
  )
}

export function Create() {
  const nav = useNavigate()
  const toast = useToast()
  const { themes } = useThemes()
  const [f, setF] = useState<GenSettings>(INITIAL)
  const [file, setFile] = useState<File | null>(null)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [busy, setBusy] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [fail, setFail] = useState<{ message: string; attempts: Attempt[] } | null>(null)

  useEffect(() => {
    api.providers().then(({ providers: ps }) => {
      setProviders(ps)
      const first = ps.find((p) => p.configured && p.id !== 'mock') ?? ps.find((p) => p.id === 'mock')
      if (first) setF((x) => ({ ...x, provider: first.id, model: first.models[0] ?? '' }))
    }).catch((e) => toast('error', e instanceof Error ? e.message : 'Backend unreachable.'))
  }, [toast])

  const set = <K extends keyof GenSettings>(k: K, v: GenSettings[K]) => setF((x) => ({ ...x, [k]: v }))
  const current = providers.find((p) => p.id === f.provider)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validateCreateForm(f, file, !!current?.configured)
    setErrors(errs)
    if (hasErrors(errs)) return
    setBusy(true); setSteps([]); setFail(null)
    let finished = false
    const onEvent = (ev: StreamEvent) => {
      if ('step' in ev) {
        const label = ev.step === 'generating' && ev.provider ? `Generating slides with ${ev.provider}` : STEP_LABEL[ev.step]
        setSteps((s) => (s[s.length - 1] === label ? s : [...s, label]))
      } else if ('error' in ev) {
        finished = true
        setFail({ message: ev.error, attempts: ev.attempts ?? [] })
        toast('error', ev.error)
      } else if ('done' in ev) {
        finished = true
        ev.notices.forEach((n) => toast('info', n))
        toast('success', `Created by ${ev.provider} (${ev.model}).`)
        nav(`/editor/${ev.presentation.id}`)
      }
    }
    try {
      await api.generate(f, file, onEvent)
      if (!finished) setFail({ message: 'The connection ended before the result arrived. Please try again.', attempts: [] })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed.'
      setFail({ message, attempts: [] }); toast('error', message)
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6" noValidate>
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 to-violet-600 p-7 text-white shadow-xl shadow-brand-600/20">
        <h1 className="text-2xl font-bold md:text-3xl">New presentation</h1>
        <p className="mt-1 text-indigo-50">Describe your topic and/or upload a document (PDF, DOCX, TXT).</p>
      </div>

      <section className="card space-y-4 p-6">
        <Head n={1} title="Your content" hint="What should the presentation be about?" />
        <div>
          <label htmlFor="topic" className="label">Topic or prompt</label>
          <textarea id="topic" className="input min-h-24" value={f.topic} maxLength={2000} aria-invalid={!!errors.topic}
            placeholder="e.g. How renewable energy is changing Pakistan's power sector" onChange={(e) => set('topic', e.target.value)} />
          {errors.topic && <p className="err">{errors.topic}</p>}
        </div>
        <div>
          <label htmlFor="file" className="label">Document (optional)</label>
          <label htmlFor="file" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-400 bg-slate-50 px-3 py-3 text-sm text-slate-800 hover:bg-slate-100">
            <Upload className="h-4 w-4" />{file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : 'Choose PDF, DOCX or TXT (max 10 MB)'}
          </label>
          <input id="file" type="file" className="sr-only" accept=".pdf,.docx,.txt" onChange={(e) => {
            const picked = e.target.files?.[0] ?? null
            const err = validateFile(picked)
            setErrors((x) => ({ ...x, file: err })); setFile(err ? null : picked)
          }} />
          {errors.file && <p className="err">{errors.file}</p>}
          {file && <button type="button" className="mt-1 text-sm text-brand-700 underline" onClick={() => setFile(null)}>Remove file</button>}
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><Head n={2} title="Settings" hint="Length, audience, language and tone" /></div>
        <div>
          <label htmlFor="slides" className="label">Number of slides (3–30)</label>
          <input id="slides" type="number" min={3} max={30} className="input" value={Number.isNaN(f.slides) ? '' : f.slides}
            onChange={(e) => set('slides', e.target.value === '' ? NaN : Number(e.target.value))} aria-invalid={!!errors.slides} />
          {errors.slides && <p className="err">{errors.slides}</p>}
        </div>
        <div>
          <label htmlFor="detail" className="label">Detail level</label>
          <select id="detail" className="input" value={f.detail} onChange={(e) => set('detail', e.target.value as GenSettings['detail'])}>
            <option value="brief">Brief</option><option value="standard">Standard</option><option value="detailed">Detailed</option>
          </select>
        </div>
        <div>
          <label htmlFor="audience" className="label">Audience</label>
          <input id="audience" className="input" value={f.audience} onChange={(e) => set('audience', e.target.value)} />
          {errors.audience && <p className="err">{errors.audience}</p>}
        </div>
        <div>
          <label htmlFor="language" className="label">Language</label>
          <input id="language" className="input" value={f.language} onChange={(e) => set('language', e.target.value)} />
          {errors.language && <p className="err">{errors.language}</p>}
        </div>
        <div>
          <label htmlFor="purpose" className="label">Purpose</label>
          <select id="purpose" className="input" value={f.purpose} onChange={(e) => set('purpose', e.target.value)}>
            {['Inform', 'Persuade', 'Teach', 'Pitch', 'Report', 'University presentation'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="tone" className="label">Tone</label>
          <select id="tone" className="input" value={f.tone} onChange={(e) => set('tone', e.target.value)}>
            {['Professional', 'Friendly', 'Academic', 'Inspiring', 'Simple and clear'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input type="checkbox" className="h-4 w-4" checked={f.speaker_notes} onChange={(e) => set('speaker_notes', e.target.checked)} />
          Generate speaker notes
        </label>
      </section>

      <section className="card space-y-3 p-6">
        <Head n={3} title="Theme" hint="Colors and fonts used in preview and exports" />
        <ThemePicker themes={themes} value={f.theme} onChange={(id) => set('theme', id)} />
      </section>

      <section className="card p-6">
        <Head n={4} title="AI provider" hint="Use Mock to test without a key" />
        <ProviderSelect providers={providers} provider={f.provider} model={f.model} error={errors.provider}
          onChange={(p, m) => setF((x) => ({ ...x, provider: p, model: m }))} />
      </section>

      {(busy || steps.length > 0) && (
        <section className="card p-5" aria-live="polite">
          <h2 className="mb-2 font-semibold">Progress</h2>
          <ol className="space-y-1 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                {busy && i === steps.length - 1 ? <Loader2 className="h-4 w-4 animate-spin text-brand-700" /> : <CheckCircle2 className="h-4 w-4 text-green-700" />}{s}
              </li>
            ))}
          </ol>
        </section>
      )}
      {fail && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4" />{fail.message}</p>
          {fail.attempts.length > 0 && (
            <ul className="mt-2 list-disc pl-6">{fail.attempts.map((a, i) => <li key={i}><b>{a.provider}</b>: {a.message}</li>)}</ul>
          )}
        </div>
      )}
      <div className="sticky bottom-3 z-10 flex justify-end rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
        <button type="submit" className="btn-primary px-8 py-3" disabled={busy}>{busy ? 'Generating…' : 'Generate presentation'}</button>
      </div>
    </form>
  )
}

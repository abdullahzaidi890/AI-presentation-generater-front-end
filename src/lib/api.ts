import type {
  Deck, EvalReport, GenSettings, Presentation, PresentationSummary, ProviderInfo, Slide, Stats, StreamEvent, Theme,
} from '../types/schema'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '' : 'https://ai-presentation-generater-backend-7z6jwxdfh-abdullah-e710.vercel.app')
).replace(/\/+$/, '')

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init)
  } catch {
    throw new ApiError('Cannot reach the backend. Check that it is running and configured.', 0)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await send(path, init)
  if (!res.ok) {
    let msg = `Request failed (${res.status}).`
    try {
      const j = await res.json()
      if (typeof j.detail === 'string') msg = j.detail
      else if (Array.isArray(j.detail)) msg = 'Some input is invalid. Please check the form.'
    } catch { /* not JSON */ }
    throw new ApiError(msg, res.status)
  }
  return (await res.json()) as T
}

const json = (method: string, data: unknown): RequestInit => ({
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
})

export const api = {
  config: () => request<{ author: string }>('/api/config'),
  providers: () => request<{ providers: ProviderInfo[]; fallback_enabled: boolean; fallback_order: string[] }>('/api/providers'),
  themes: async () => (await request<{ themes: Theme[] }>('/api/themes')).themes,
  testProvider: (name: string) => request<{ ok: boolean; message: string; kind?: string; model?: string }>(`/api/providers/${name}/test`, { method: 'POST' }),
  stats: () => request<Stats>('/api/stats'),
  list: async (q = '', provider = '') =>
    (await request<{ items: PresentationSummary[] }>(`/api/presentations?q=${encodeURIComponent(q)}&provider=${encodeURIComponent(provider)}`)).items,
  get: (id: string) => request<Presentation>(`/api/presentations/${id}`),
  save: (id: string, title: string, content: Deck, theme: string) =>
    request<Presentation>(`/api/presentations/${id}`, json('PUT', { title, content, theme })),
  rename: (id: string, title: string) => request<PresentationSummary>(`/api/presentations/${id}`, json('PATCH', { title })),
  duplicate: (id: string) => request<PresentationSummary>(`/api/presentations/${id}/duplicate`, { method: 'POST' }),
  remove: (id: string) => request<{ deleted: boolean }>(`/api/presentations/${id}`, { method: 'DELETE' }),
  regenSlide: (body: { deck_title: string; slide: Slide; instruction: string; provider: string; model: string; language: string; other_titles: string[] }) =>
    request<{ slide: Slide; provider: string; model: string; fallback_used: boolean; notices: string[] }>('/api/generate/slide', json('POST', body)),
  evaluate: (id: string, ai: boolean, provider: string) =>
    request<EvalReport>(`/api/presentations/${id}/evaluate?ai=${ai}&provider=${encodeURIComponent(provider)}`, { method: 'POST' }),

  /** Streams real progress events (NDJSON) from the backend. */
  async generate(s: GenSettings, file: File | null, onEvent: (e: StreamEvent) => void): Promise<void> {
    const form = new FormData()
    Object.entries(s).forEach(([k, v]) => form.append(k, String(v)))
    if (file) form.append('file', file)
    const res = await send('/api/generate', { method: 'POST', body: form })
    if (!res.ok || !res.body) {
      let msg = `Request failed (${res.status}).`
      try { const j = await res.json(); if (typeof j.detail === 'string') msg = j.detail } catch { /* ignore */ }
      throw new ApiError(msg, res.status)
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let i: number
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (line) onEvent(JSON.parse(line) as StreamEvent)
      }
    }
  },

  /** Downloads a file; returns an error message instead of throwing so the UI can toast it. */
  async download(id: string, kind: 'pptx' | 'pdf', fallbackName: string): Promise<string | null> {
    try {
      const res = await send(`/api/presentations/${id}/export/${kind}`)
      if (!res.ok) return `${kind.toUpperCase()} export failed. Try saving the deck and exporting again.`
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${fallbackName.replace(/[^\w\- ]/g, '').trim().replace(/ +/g, '_') || 'presentation'}.${kind}`
      a.click()
      URL.revokeObjectURL(a.href)
      return null
    } catch (e) {
      return e instanceof ApiError ? e.message : 'Export failed.'
    }
  },
}

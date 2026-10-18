// Mirror of backend/app/models/schema.py (the backend is the source of truth).
export const LAYOUTS = ['title', 'bullets', 'two_column', 'quote', 'chart', 'closing'] as const
export type Layout = (typeof LAYOUTS)[number]

export interface Slide {
  id: string
  layout: Layout
  title: string
  bullets: string[]
  speaker_notes: string
  visual_suggestion: string
  references: string[]
}
export interface Deck { title: string; language: string; slides: Slide[] }

export interface Theme {
  id: string; name: string; bg: string[]; title: string; text: string; accent: string; muted: string
  font_heading: string; font_body: string
}
export interface ProviderInfo {
  id: string; label: string; configured: boolean; models: string[]; docs: string; key_url: string; tooltip: string
}
export interface PresentationSummary {
  id: string; title: string; theme: string; provider: string; model: string; fallback_used: boolean
  slide_count: number; created_at: string; updated_at: string; cover?: Slide | null
}
export interface GenSettings {
  topic: string; slides: number; audience: string; language: string; purpose: string; tone: string
  theme: string; detail: 'brief' | 'standard' | 'detailed'; speaker_notes: boolean; provider: string; model: string
}
export interface Presentation extends PresentationSummary { content: Deck; settings: Partial<GenSettings> }
export interface Attempt { provider: string; kind: string; message: string }
export interface Stats { presentations: number; slides: number; providers_used: number }

export type StreamEvent =
  | { step: 'reading' | 'generating' | 'retrying' | 'validating' | 'saving'; detail?: string; provider?: string; model?: string }
  | { done: true; presentation: Presentation; notices: string[]; provider: string; model: string; fallback_used: boolean }
  | { error: string; kind: string; attempts?: Attempt[] }

export interface Check { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string; suggestion: string }
export interface EvalReport {
  score: number; checks: Check[]; kind: string
  ai: null | { scores: { relevance: number; logical_flow: number; clarity: number; topic_coverage: number; comments: string[] }; provider: string; model: string; label: string }
  ai_error?: string
}

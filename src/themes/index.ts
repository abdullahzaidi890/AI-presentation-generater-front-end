import type { Theme } from '../types/schema'

/** Themes come from the backend (single source of design tokens shared with PPTX/PDF export). */
export const bgCss = (t: Theme) => (t.bg.length === 1 ? t.bg[0] : `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]})`)

export const FALLBACK_THEME: Theme = {
  id: 'minimal_academic', name: 'Minimal Academic', bg: ['#FFFFFF'], title: '#111827', text: '#1F2937',
  accent: '#1D4ED8', muted: '#4B5563', font_heading: 'Georgia', font_body: 'Calibri',
}

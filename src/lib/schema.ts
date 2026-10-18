import { LAYOUTS, type Deck, type Slide } from '../types/schema'

const isStr = (v: unknown): v is string => typeof v === 'string'
const isStrArr = (v: unknown, max: number): v is string[] => Array.isArray(v) && v.length <= max && v.every(isStr)

/** Runtime check that data really matches the Slide type (used before trusting server/edit data). */
export function isSlide(v: unknown): v is Slide {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    isStr(s.id) && isStr(s.title) && s.title.length <= 200 &&
    (LAYOUTS as readonly string[]).includes(s.layout as string) &&
    isStrArr(s.bullets, 10) && isStr(s.speaker_notes) && isStr(s.visual_suggestion) && isStrArr(s.references, 10)
  )
}

export function isDeck(v: unknown): v is Deck {
  if (typeof v !== 'object' || v === null) return false
  const d = v as Record<string, unknown>
  return isStr(d.title) && isStr(d.language) && Array.isArray(d.slides) && d.slides.length >= 1 && d.slides.length <= 40 && d.slides.every(isSlide)
}

export function newSlide(): Slide {
  return {
    id: crypto.randomUUID(), layout: 'bullets', title: 'New slide', bullets: ['First point', 'Second point', 'Third point'],
    speaker_notes: '', visual_suggestion: '', references: [],
  }
}

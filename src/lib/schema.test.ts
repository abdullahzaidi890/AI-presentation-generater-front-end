import { describe, expect, it } from 'vitest'
import { isDeck, isSlide, newSlide } from './schema'

const good = { id: '1', layout: 'bullets', title: 'T', bullets: ['a'], speaker_notes: '', visual_suggestion: '', references: [] }

describe('schema type guards', () => {
  it('accepts a valid slide and deck', () => {
    expect(isSlide(good)).toBe(true)
    expect(isDeck({ title: 'D', language: 'English', slides: [good] })).toBe(true)
    expect(isSlide({ ...newSlide(), id: 'x' })).toBe(true)
  })
  it('rejects bad layout, missing fields and wrong types', () => {
    expect(isSlide({ ...good, layout: 'weird' })).toBe(false)
    expect(isSlide({ ...good, bullets: [1] })).toBe(false)
    expect(isSlide({ ...good, title: undefined })).toBe(false)
    expect(isSlide(null)).toBe(false)
  })
  it('rejects empty or oversized decks', () => {
    expect(isDeck({ title: 'D', language: 'x', slides: [] })).toBe(false)
    expect(isDeck({ title: 'D', language: 'x', slides: Array(41).fill(good) })).toBe(false)
  })
})

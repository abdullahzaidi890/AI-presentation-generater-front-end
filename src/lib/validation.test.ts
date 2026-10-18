import { describe, expect, it } from 'vitest'
import type { GenSettings } from '../types/schema'
import { hasErrors, validateCreateForm, validateFile } from './validation'

const base: GenSettings = {
  topic: 'Solar energy', slides: 8, audience: 'Students', language: 'English', purpose: 'Inform', tone: 'Professional',
  theme: 'minimal_academic', detail: 'standard', speaker_notes: true, provider: 'mock', model: '',
}
const file = (name: string, size: number) => ({ name, size }) as File

describe('create form validation', () => {
  it('accepts a valid form', () => expect(hasErrors(validateCreateForm(base, null, true))).toBe(false))
  it('needs a topic or a file', () => {
    expect(validateCreateForm({ ...base, topic: '  ' }, null, true).topic).toBeTruthy()
    expect(validateCreateForm({ ...base, topic: '' }, file('a.pdf', 100), true).topic).toBeUndefined()
  })
  it('limits slide count to 3-30 whole numbers', () => {
    for (const n of [2, 31, 5.5, NaN]) expect(validateCreateForm({ ...base, slides: n }, null, true).slides).toBeTruthy()
    for (const n of [3, 30]) expect(validateCreateForm({ ...base, slides: n }, null, true).slides).toBeUndefined()
  })
  it('requires language, audience and a configured provider', () => {
    const e = validateCreateForm({ ...base, language: '', audience: '' }, null, false)
    expect(e.language && e.audience && e.provider).toBeTruthy()
  })
})

describe('file validation', () => {
  it('rejects wrong type, empty and oversize files', () => {
    expect(validateFile(file('virus.exe', 10))).toMatch(/PDF, DOCX or TXT/)
    expect(validateFile(file('a.txt', 0))).toMatch(/empty/)
    expect(validateFile(file('a.pdf', 11 * 1024 * 1024))).toMatch(/10 MB/)
  })
  it('accepts allowed files in any letter case', () => {
    expect(validateFile(file('Report.PDF', 1000))).toBeUndefined()
    expect(validateFile(null)).toBeUndefined()
  })
})

import type { GenSettings } from '../types/schema'

export const MAX_UPLOAD_MB = 10
export const ALLOWED_EXT = ['.pdf', '.docx', '.txt']

export interface FormErrors { [field: string]: string | undefined }

export function validateFile(file: File | null): string | undefined {
  if (!file) return undefined
  const lower = file.name.toLowerCase()
  if (!ALLOWED_EXT.some((e) => lower.endsWith(e))) return 'Only PDF, DOCX or TXT files are allowed.'
  if (file.size === 0) return 'The file is empty.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `The file is larger than ${MAX_UPLOAD_MB} MB.`
  return undefined
}

export function validateCreateForm(f: GenSettings, file: File | null, providerConfigured: boolean): FormErrors {
  const e: FormErrors = {}
  if (!f.topic.trim() && !file) e.topic = 'Enter a topic or upload a document.'
  if (f.topic.length > 2000) e.topic = 'Topic is too long (max 2000 characters).'
  if (!Number.isInteger(f.slides) || f.slides < 3 || f.slides > 30) e.slides = 'Slides must be a whole number from 3 to 30.'
  if (!f.language.trim()) e.language = 'Language is required.'
  if (!f.audience.trim()) e.audience = 'Audience is required.'
  if (!providerConfigured) e.provider = 'This provider is not configured. Add its key to .env or pick another.'
  const fe = validateFile(file)
  if (fe) e.file = fe
  return e
}

export const hasErrors = (e: FormErrors) => Object.values(e).some(Boolean)

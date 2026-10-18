import { useEffect, useState } from 'react'
import { FALLBACK_THEME } from '../themes'
import type { Theme } from '../types/schema'
import { api } from './api'

let cache: Theme[] | null = null

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>(cache ?? [FALLBACK_THEME])
  useEffect(() => {
    if (cache) return
    api.themes().then((t) => { cache = t; setThemes(t) }).catch(() => { /* backend offline: fallback theme only */ })
  }, [])
  const byId = (id: string) => themes.find((t) => t.id === id) ?? themes[0] ?? FALLBACK_THEME
  return { themes, byId }
}

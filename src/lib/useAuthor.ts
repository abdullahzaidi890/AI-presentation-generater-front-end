import { useEffect, useState } from 'react'
import { api } from './api'

let cached: string | null = null

/** Author name comes from the backend (AUTHOR_NAME in .env). */
export function useAuthor() {
  const [author, setAuthor] = useState(cached ?? 'Syed Abdullah')
  useEffect(() => {
    if (cached !== null) return
    api.config().then((c) => { cached = c.author; setAuthor(c.author) }).catch(() => {})
  }, [])
  return author
}

import { Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SlideView } from '../components/SlideView'
import { api } from '../lib/api'
import { useAuthor } from '../lib/useAuthor'
import { useThemes } from '../lib/useThemes'
import type { Presentation } from '../types/schema'

export function PrintView() {
  const { id = '' } = useParams()
  const { byId } = useThemes()
  const author = useAuthor()
  const [p, setP] = useState<Presentation | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { api.get(id).then(setP).catch((e) => setErr(e instanceof Error ? e.message : 'Not found')) }, [id])
  if (err) return <p className="err">{err}</p>
  if (!p) return <p>Loading…</p>
  const theme = byId(p.theme)
  return (
    <div className="mx-auto max-w-5xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{p.title} — print view</h1>
        <button className="btn-primary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print / Save as PDF</button>
      </div>
      <div className="space-y-4">{p.content.slides.map((s) => <SlideView key={s.id} slide={s} theme={theme} footer={`Created by ${author}`} className="print-slide" />)}</div>
    </div>
  )
}

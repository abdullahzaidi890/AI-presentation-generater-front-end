import { AlertTriangle, CheckCircle2, Sparkles, XCircle } from 'lucide-react'
import type { EvalReport } from '../types/schema'

const icon = {
  pass: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" aria-label="pass" />,
  warn: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-label="warning" />,
  fail: <XCircle className="h-4 w-4 shrink-0 text-red-700" aria-label="fail" />,
}

export function QualityPanel(p: { report: EvalReport | null; loading: boolean; onRun: () => void; onRunAi: () => void }) {
  const r = p.report
  return (
    <section className="card p-4" aria-label="Quality report">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Quality report</h3>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={p.onRun} disabled={p.loading}>{p.loading ? 'Checking…' : 'Run checks'}</button>
          <button className="btn-secondary" onClick={p.onRunAi} disabled={p.loading}><Sparkles className="h-4 w-4" />AI estimate</button>
        </div>
      </div>
      {!r && <p className="text-sm text-slate-600">Run the checks to see rule-based results (computed, not AI).</p>}
      {r && (
        <>
          <p className="mb-2 text-sm"><span className="text-2xl font-bold">{r.score}</span>/100 <span className="text-slate-600">· {r.kind}</span></p>
          <ul className="space-y-2">
            {r.checks.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm">
                {icon[c.status]}
                <div><b>{c.label}:</b> {c.detail}{c.suggestion && <p className="text-slate-700">Tip: {c.suggestion}</p>}</div>
              </li>
            ))}
          </ul>
          {r.ai && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium">{r.ai.label} <span className="font-normal text-slate-600">({r.ai.provider} · {r.ai.model})</span></p>
              <p>Relevance {r.ai.scores.relevance}/10 · Flow {r.ai.scores.logical_flow}/10 · Clarity {r.ai.scores.clarity}/10 · Coverage {r.ai.scores.topic_coverage}/10</p>
              <ul className="mt-1 list-disc pl-5">{r.ai.scores.comments.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
          {r.ai_error && <p className="err">AI estimate failed: {r.ai_error}</p>}
        </>
      )}
    </section>
  )
}

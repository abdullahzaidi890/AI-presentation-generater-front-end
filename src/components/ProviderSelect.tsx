import { Plug } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import type { ProviderInfo } from '../types/schema'
import { useToast } from './Toast'

interface Props { providers: ProviderInfo[]; provider: string; model: string; onChange: (provider: string, model: string) => void; error?: string }

export function ProviderSelect({ providers, provider, model, onChange, error }: Props) {
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const current = providers.find((p) => p.id === provider)

  const test = async () => {
    setTesting(true)
    try {
      const r = await api.testProvider(provider)
      toast(r.ok ? 'success' : 'error', r.ok ? `${current?.label}: ${r.message}` : `${current?.label}: ${r.message}`)
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Test failed.')
    } finally { setTesting(false) }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="provider" className="label">AI provider</label>
        <select id="provider" className="input" value={provider} onChange={(e) => {
          const p = providers.find((x) => x.id === e.target.value)
          onChange(e.target.value, p?.models[0] ?? '')
        }}>
          {providers.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.configured} title={p.tooltip}>
              {p.label}{p.configured ? '' : ' (not configured)'}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="model" className="label">Model</label>
        <select id="model" className="input" value={model} onChange={(e) => onChange(provider, e.target.value)}>
          {(current?.models ?? []).map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <button type="button" className="btn-secondary" onClick={test} disabled={testing || !current?.configured}
        title={current?.configured ? 'Send a tiny test request' : 'Add the key to .env first'}>
        <Plug className="h-4 w-4" />{testing ? 'Testing…' : 'Test connection'}
      </button>
      {error && <p className="err sm:col-span-3">{error}</p>}
      {providers.some((p) => !p.configured) && (
        <p className="text-xs text-slate-600 sm:col-span-3">
          Providers shown as “not configured” need an API key in <code>.env</code> (see README). Mock works without any key.
        </p>
      )}
    </div>
  )
}

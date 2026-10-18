import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Kind = 'success' | 'error' | 'info'
interface T { id: number; kind: Kind; text: string }
const Ctx = createContext<(kind: Kind, text: string) => void>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, kind, text }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'error' ? 8000 : 4000)
  }, [])
  const icon = { success: <CheckCircle2 className="h-5 w-5 text-green-700" />, error: <XCircle className="h-5 w-5 text-red-700" />, info: <Info className="h-5 w-5 text-brand-700" /> }
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite" role="status">
        {items.map((i) => (
          <div key={i.id} className="card flex items-start gap-3 p-3 text-sm">
            {icon[i.kind]}
            <p className="flex-1 text-slate-800">{i.text}</p>
            <button aria-label="Dismiss notification" onClick={() => setItems((x) => x.filter((t) => t.id !== i.id))}>
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

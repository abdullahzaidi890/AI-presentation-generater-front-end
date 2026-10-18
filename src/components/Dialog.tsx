import { useEffect, type ReactNode } from 'react'

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-md p-5" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog(p: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog title={p.title} onClose={p.onClose}>
      <p className="mb-4 text-sm text-slate-700">{p.message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={p.onClose} autoFocus>Cancel</button>
        <button className="btn-danger" onClick={p.onConfirm}>{p.confirmLabel}</button>
      </div>
    </Dialog>
  )
}

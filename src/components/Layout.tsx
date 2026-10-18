import { LayoutDashboard, PlusCircle, Presentation, ShieldCheck, Sparkles } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthor } from '../lib/useAuthor'

const link = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
    isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`

export function Layout() {
  const author = useAuthor()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="no-print flex flex-col bg-slate-900 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 p-2 text-white shadow-lg shadow-brand-600/40">
            <Presentation className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-white">Slide<span className="text-violet-300">AI</span></p>
            <p className="text-xs text-slate-300">by {author}</p>
          </div>
        </div>
        <nav className="flex gap-1 px-3 pb-3 md:flex-col md:pb-0" aria-label="Main">
          <NavLink to="/" end className={link}><LayoutDashboard className="h-4 w-4" />Dashboard</NavLink>
          <NavLink to="/create" className={link}><PlusCircle className="h-4 w-4" />New presentation</NavLink>
        </nav>
        <div className="mt-auto hidden p-4 md:block">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" />Local single-user mode</p>
            <p className="mt-1 text-xs text-slate-400">Your decks stay on this computer. API keys never leave the backend.</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs font-medium text-slate-200">Created by {author}</p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: 'radial-gradient(900px 320px at 75% -80px, #e0e7ff 0%, rgba(248,250,252,0) 70%), #f8fafc' }}>
        <header className="no-print flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur md:px-8">
          <p className="flex items-center gap-2 text-sm text-slate-700"><Sparkles className="h-4 w-4 text-violet-600" />Turn ideas and documents into slides</p>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">Local single-user mode</span>
        </header>
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  )
}

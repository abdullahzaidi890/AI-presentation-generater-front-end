import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { Create } from './pages/Create'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import { PrintView } from './pages/PrintView'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<Create />} />
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/print/:id" element={<PrintView />} />
            <Route path="*" element={<p className="err">Page not found.</p>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The dev server proxies /api to the FastAPI backend, so no keys or CORS tricks are needed in the browser.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})

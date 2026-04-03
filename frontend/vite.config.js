import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** Proxy target for API (override if port 8000 is busy: VITE_BACKEND_URL=http://127.0.0.1:8001) */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/debate': { target: backend, changeOrigin: true },
        '/health': { target: backend, changeOrigin: true },
      },
    },
  }
})

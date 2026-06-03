import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // ✅ Proxy only used in local dev (npm run dev)
    // In production, VITE_API_URL env var points to Oracle server directly
    proxy: {
      '/api': {
        target: 'https://rajaksatyam.github.io',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})

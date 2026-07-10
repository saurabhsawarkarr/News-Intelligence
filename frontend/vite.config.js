import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external connections (0.0.0.0)
    allowedHosts: true, // Allow ngrok/localtunnel/localhost.run domains
    cors: true,
    proxy: {
      // Proxy /api requests to the FastAPI backend during development
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

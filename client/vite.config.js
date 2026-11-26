import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // @simplewebauthn/browser will be installed in Phase 7.
    // Mark it external so the build doesn't fail until then.
    rollupOptions: {
      external: ['@simplewebauthn/browser'],
    },
  },
})

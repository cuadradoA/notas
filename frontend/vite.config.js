import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  plugins: [react()],
})

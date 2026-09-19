import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // this, local dev and any root-hosted deploy stay at '/'.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { port: 3017, host: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})

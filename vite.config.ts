import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages has no SPA fallback: a hard refresh on /physarum/studio is a 404. Serving the app
 * shell as 404.html makes Pages hand every unknown path to the router instead.
 */
const spaFallback = (): Plugin => ({
  name: 'spa-fallback',
  apply: 'build',
  closeBundle() {
    const dist = resolve(fileURLToPath(new URL('./dist', import.meta.url)))
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
  },
})

export default defineConfig(({ command }) => ({
  // Pages serves the site from /physarum/; the dev server stays at the root.
  base: command === 'build' ? (process.env.BASE_PATH ?? '/physarum/') : '/',
  plugins: [react(), spaFallback()],
  resolve: {
    // Keep in step with `paths` in tsconfig.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT for GitHub Pages: set `base` to "/<your-repo-name>/".
// If you deploy to a custom domain or username.github.io root, set base to '/'.
const REPO_BASE = '/kitten-tracker/'

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Kitten Tracker',
        short_name: 'Kitten',
        description: 'Track your kitten\'s food, water, and litter — offline, local-only.',
        theme_color: '#1f2421',
        background_color: '#f7f4ee',
        display: 'standalone',
        orientation: 'portrait',
        scope: REPO_BASE,
        start_url: REPO_BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Tesseract & wasm files can be large; raise the cache limit.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'off-api', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } }
          },
          {
            urlPattern: /^https:\/\/world\.openpetfoodfacts\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'opff-api', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } }
          }
        ]
      }
    })
  ]
})

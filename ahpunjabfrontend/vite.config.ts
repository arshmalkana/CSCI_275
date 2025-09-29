import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-96x96.png',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'web-app-manifest-192x192.png',
        'web-app-manifest-512x512.png',
        'pwa-icon.svg',
      ],
      manifest: {
        name: 'AH Punjab Reporting',
        short_name: 'AH Punjab',
        description: 'Animal Husbandry Department Punjab - Reporting System',
        theme_color: '#E9BE28',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['government', 'productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          // PNG icons for better iOS compatibility
          {
            src: 'favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          // SVG as fallback for modern browsers
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ],
        shortcuts: [
          {
            name: 'New Report',
            short_name: 'Report',
            description: 'Create a new monthly report',
            url: '/reports/new',
            icons: [{ src: 'pwa-icon.svg', sizes: '96x96' }]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View analytics dashboard',
            url: '/dashboard',
            icons: [{ src: 'pwa-icon.svg', sizes: '96x96' }]
          }
        ],
        display_override: ['standalone', 'minimal-ui'],
        // display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        // protocol_handlers: [
        //   {
        //     protocol: 'web+ahpunjab',
        //     url: '/?handler=%s'
        //   }
        // ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    allowedHosts: true,
    port: 4173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})

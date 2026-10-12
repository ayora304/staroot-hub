import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'service-worker.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: false, // we ship public/manifest.webmanifest ourselves
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Report rendering is demand-loaded. Cache it after use instead of inflating every install/update download.
        globIgnores: ['**/assets/docx-*.js', '**/assets/jspdf.*.js', '**/assets/html2canvas.*.js', '**/assets/purify.*.js'],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: true,
    // Run api/ handlers locally on this port with whatever host tooling is chosen.
    proxy: { '/api': process.env.API_DEV_TARGET ?? 'http://localhost:3001' },
  },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
})

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0-dev'),
  },
  server: {
    hmr: process.env.VITE_HMR_HOST
      ? {
          host: process.env.VITE_HMR_HOST,
          clientPort: Number(process.env.VITE_HMR_CLIENT_PORT ?? 443),
        }
      : undefined,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('credentials', 'include');
          });
        },
      },
      '/actuator': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Todo',
        short_name: 'Todo',
        display: 'standalone',
        start_url: '/lists',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/lists(\/.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-lists',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^\/api\/users\/me$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-user',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: true }
    })
  ]
});

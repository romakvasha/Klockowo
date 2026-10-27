import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Офлайн і встановлення на телефон (M24): service worker кешує всю збірку (код, шрифти, картинки), записаний голос — поступово (V5), маніфест додає іконку «Klockowo» на екран. У тестах плагін не потрібен.
    mode !== 'test' &&
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // реєструємо самі в main.tsx — лише в production
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Klockowo',
          short_name: 'Klockowo',
          description: 'Zabawa w liczenie do stu z blokowym pieskiem Kubikiem.',
          lang: 'pl',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          background_color: '#FFF7E8',
          theme_color: '#FFF7E8',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff,json,mp3,ogg,wav}'],
          // Записаний голос (тисячі mp3, десятки МБ) — не в першому завантаженні: файли кешуються, коли звучать, а найчутніші
          // тихо докачуються після старту (speech/clipCache.ts). Маніфест — спершу з мережі (нові записи), без мережі — з кешу.
          globIgnores: ['audio/**'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/audio/') && url.pathname.endsWith('/manifest.json'),
              handler: 'NetworkFirst',
              options: { cacheName: 'klockowo-voice-manifest', networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ url }) => url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3'),
              handler: 'CacheFirst',
              // <audio> просить шматки (Range): з кешу їх вирізає rangeRequests; у кеш ідуть лише повні відповіді (200)
              options: { cacheName: 'klockowo-voice', rangeRequests: true, cacheableResponse: { statuses: [200] } },
            },
          ],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: { enabled: false },
      }),
  ],
  // HashRouter + відносні шляхи: сайт працює з будь-якої теки чи піддомену (GitHub Pages тощо)
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // tokens.css читають тести узгодженості (кольори світів); решту CSS Vitest замінює порожнім рядком
    css: { include: [/styles[\\/]tokens\.css/] },
  },
}));

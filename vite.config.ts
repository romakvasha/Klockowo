import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Офлайн і встановлення на телефон (M24): service worker кешує всю збірку (код, шрифти, картинки, mp3), маніфест додає іконку «Klockowo» на екран. У тестах плагін не потрібен.
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

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // HashRouter + відносні шляхи: сайт працює з будь-якої теки чи піддомену (GitHub Pages тощо)
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // tokens.css читають тести узгодженості (кольори світів); решту CSS Vitest замінює порожнім рядком
    css: { include: [/styles[\\/]tokens\.css/] },
  },
});

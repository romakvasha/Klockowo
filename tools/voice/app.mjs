// Код гри (TypeScript із src/) для Node-скриптів голосу: Vite збирає модулі на льоту (ssrLoadModule), як і тести.
// mode 'test' — без PWA-плагіна; сервер без HMR і без мережі.
import { createServer } from 'vite';
import { ROOT } from './eleven.mjs';

/** Відкриває модулі гри; після роботи викличте close(). */
export async function openApp() {
  const server = await createServer({
    root: ROOT,
    mode: 'test',
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  return {
    load: (path) => server.ssrLoadModule(path),
    close: () => server.close(),
  };
}

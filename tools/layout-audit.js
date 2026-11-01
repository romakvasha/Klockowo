// Перевірка розкладки без накладань (D3, docs/DESIGN_V2.md §3) — виконується на сторінці через tools/shot.mjs --json.
// Для кожного маршруту: кнопки, цеглинки, картки, Kubik і бульбашка не перетинаються між собою (крім предка й нащадка) і не виходять за в'юпорт.
// Предмети всередині прокручуваних областей (мапа, стежка) і декор сцени не перевіряються.
//   node tools/shot.mjs --url="http://localhost:5173/#/start" --w=844 --h=390 --touch --wait=1500 --out=C:/tmp/x.png --json="$(cat tools/layout-audit.js)"
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const { appStore } = await import('/src/store/index.ts');
  const st = appStore.getState();
  if (!st.profiles?.length) st.addProfile({ pup: 'pon' });
  sessionStorage.setItem('klockowo.parentAccess', String(Date.now()));
  const style = document.createElement('style');
  style.textContent = '*{animation-duration:0s!important;transition-duration:0s!important;animation-delay:0s!important}';
  document.head.append(style);

  const routes = (window.__routes ?? [
    '/loading', '/start', '/pup', '/map', '/world/w1', '/mission/w1-1', '/play/w1-1', '/done/w1-1', '/world-done/w1', '/album', '/badges',
    '/break', '/end', '/playground', '/parent-gate', '/parent', '/error', '/no-voice',
  ]);
  const SEL = 'button, a[href], [role="button"], .kl-brick, .kl-card, [data-layout], [class*="bubble"]';
  const W = innerWidth, H = innerHeight;
  const scrolls = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if ((/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) || (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1)) return true;
    }
    return false;
  };
  const name = (el) => (el.getAttribute('aria-label') || el.className?.toString?.().split(' ')[0] || el.tagName).slice(0, 28);
  const out = {};
  for (const r of routes) {
    location.hash = '#' + r;
    await sleep(window.__wait ?? 900);
    const els = [...document.querySelectorAll(SEL)].filter((el) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && b.width > 4 && b.height > 4 && !el.closest('[aria-hidden="true"]') && !scrolls(el);
    });
    const boxes = els.map((el) => [el, el.getBoundingClientRect()]);
    const issues = [];
    if (document.documentElement.scrollHeight > H + 1 || document.documentElement.scrollWidth > W + 1) issues.push(`page scrolls ${document.documentElement.scrollWidth}×${document.documentElement.scrollHeight}`);
    for (const [el, b] of boxes) {
      if (b.left < -1 || b.top < -1 || b.right > W + 1 || b.bottom > H + 1) issues.push(`out: ${name(el)} ${Math.round(b.left)},${Math.round(b.top)}–${Math.round(b.right)},${Math.round(b.bottom)}`);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, A] = boxes[i], [c, C] = boxes[j];
        if (a.contains(c) || c.contains(a)) continue;
        const w = Math.min(A.right, C.right) - Math.max(A.left, C.left), h = Math.min(A.bottom, C.bottom) - Math.max(A.top, C.top);
        if (w > 2 && h > 2) issues.push(`overlap: ${name(a)} × ${name(c)} (${Math.round(w)}×${Math.round(h)})`);
      }
    }
    out[r] = issues.length ? issues.slice(0, 8) : 'ok';
  }
  return out;
})();

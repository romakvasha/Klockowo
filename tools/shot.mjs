// Службовий інструмент перевірки вигляду (не частина сайту): headless Chrome через DevTools Protocol, без залежностей.
// Робить скриншот сторінки чи елемента в заданому в'юпорті, може натиснути/утримати елемент, натиснути Tab, увімкнути
// prefers-reduced-motion і виконати JS (для перевірки computed-стилів). Потрібні Node ≥ 22 і Chrome (шлях — CHROME_PATH).
//
//   node tools/shot.mjs --url="http://localhost:5173/#/dev/ui" --w=1280 --h=900 --out=C:/tmp/x.png
//     --selector=css [--index=0] [--pad=12]   знімати лише цей елемент (CSS-селектор, n-й збіг) із полями
//     --full                                  вся сторінка (до 12000 px заввишки)
//     --scale=2                               щільність пікселів (чіткіше дрібні деталі)
//     --touch                                 емуляція телефона (mobile + touch)
//     --reduce | --dark                       prefers-reduced-motion / prefers-color-scheme: dark
//     --wait=1200                             скільки мс чекати після завантаження (рендер React, шрифти)
//     --json=js                               виконати JS на сторінці й вивести результат (до взаємодій)
//     --tab=N                                 натиснути Tab N разів (реальний :focus-visible)
//     --hold=css                              притиснути мишу до елемента (реальний :active) і не відпускати
//     --after=js                              виконати JS і вивести результат ПІСЛЯ --tab / --hold
//
// Шлях --out пишіть із прямими слешами (C:/…). Скриншот потім можна відкрити інструментом Read.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=([\s\S]*))?$/.exec(a);
    return [m[1], m[2] ?? true];
  }),
);
const num = (v, d) => (v === undefined || v === true ? d : Number(v));
const W = num(args.w, 1280);
const H = num(args.h, 900);
const SCALE = num(args.scale, 1);
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(path.join(tmpdir(), 'kl-chrome-'));

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', 'about:blank'],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForChrome() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* ще не піднявся */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}

let ws;
let nextId = 0;
const pending = new Map();
const events = [];
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(`eval failed: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text}`);
  return res.result.value;
}

try {
  const wsUrl = await waitForChrome();
  ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) events.push(msg);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: SCALE, mobile: Boolean(args.touch),
  });
  if (args.touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const features = [];
  if (args.reduce) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  if (args.dark) features.push({ name: 'prefers-color-scheme', value: 'dark' });
  if (features.length) await send('Emulation.setEmulatedMedia', { features });

  await send('Page.navigate', { url: args.url });
  for (let i = 0; i < 80 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(150);
  await evaluate('document.fonts.ready.then(() => true)');
  await sleep(num(args.wait, 1200));

  if (args.json) console.log(JSON.stringify(await evaluate(args.json), null, 2));

  const tabs = num(args.tab, 0);
  for (let i = 0; i < tabs; i++) {
    for (const type of ['keyDown', 'keyUp']) {
      await send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    }
    await sleep(60);
  }

  if (args.hold) {
    const pt = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(args.hold)}); el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); return {x: r.x + r.width/2, y: r.y + r.height/2}; })()`,
    );
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await sleep(300);
  }
  if (args.after) console.log(JSON.stringify(await evaluate(args.after), null, 2));

  if (args.out) {
    let clip;
    if (args.selector) {
      const pad = num(args.pad, 12);
      const index = num(args.index, 0);
      const rect = await evaluate(
        `(() => { const el = document.querySelectorAll(${JSON.stringify(args.selector)})[${index}]; if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height}; })()`,
      );
      if (!rect) throw new Error(`selector not found: ${args.selector}[${index}]`);
      clip = {
        x: Math.max(0, rect.x - pad), y: Math.max(0, rect.y - pad),
        width: Math.min(rect.width + pad * 2, 4000), height: Math.min(rect.height + pad * 2, 6000), scale: 1,
      };
    } else if (args.full) {
      const m = await send('Page.getLayoutMetrics');
      clip = { x: 0, y: 0, width: m.cssContentSize.width, height: Math.min(m.cssContentSize.height, 12000), scale: 1 };
    }
    const shot = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: Boolean(clip) });
    writeFileSync(args.out, Buffer.from(shot.data, 'base64'));
    console.log(`saved ${args.out}`);
  }
} finally {
  try {
    ws?.close();
  } catch {
    /* ігноруємо */
  }
  chrome.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* профіль ще зайнято — не страшно */
  }
}
process.exit(0);

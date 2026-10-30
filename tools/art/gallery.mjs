// Галерея готових картинок (D2a) → design/v2/gallery.html: вирізки з src/assets/v2/<group>/<id>.webp за наборами з assets.mjs,
// на шаховому / темному / світлому тлі; зауваги перевірки — з review.mjs; «Перегенерувати» запам'ятовується в браузері,
// «Копіювати список» дає id для повторної генерації на сторінці-пакеті.
// Запуск: node tools/art/gallery.mjs   Відкрити: http://localhost:5173/design/v2/gallery.html (npm run dev) або файлом.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { ASSETS, SETS } from './assets.mjs';
import { REVIEW } from './review.mjs';

const root = new URL('../../', import.meta.url);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Розмір WebP із заголовка (VP8X / VP8L / VP8). */
function webpSize(buf) {
  if (buf.length < 30) return [0, 0];
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
}

let total = 0, bytes = 0;
const marks = { redo: 0, check: 0 };
function card(a) {
  const rel = `src/assets/v2/${a.group}/${a.id}.webp`;
  const file = new URL(rel, root);
  const r = REVIEW[a.id];
  if (r) marks[r.v]++;
  if (!existsSync(file)) return `<article class="card missing" data-id="${a.id}"><div class="pic"></div><p class="id">${a.id}</p><p class="meta">немає файла</p></article>`;
  const [w, h] = webpSize(readFileSync(file));
  const kb = Math.round(statSync(file).size / 1024);
  total++; bytes += statSync(file).size;
  const note = r ? `<p class="note ${r.v}">${r.v === 'redo' ? 'Перегенерувати' : 'Глянути'}: ${esc(r.note)}</p>` : '';
  return `<article class="card${a.cut ? '' : ' scene'}${r ? ` flag-${r.v}` : ''}" data-id="${a.id}">
<div class="pic"><img src="../../${rel}" alt="${a.id}" loading="lazy" width="${w}" height="${h}"></div>
<p class="id">${a.id}</p><p class="meta">${w}×${h} · ${kb} КБ</p>${note}
<label class="redo"><input type="checkbox" data-redo="${a.id}"${r?.v === 'redo' ? ' data-suggest' : ''}> перегенерувати</label>
</article>`;
}

const sections = SETS.map((s) => {
  const items = ASSETS.filter((a) => a.set === s.key);
  return `<section id="set-${s.key}"><h2>${esc(s.title)} <small>${items.length}</small></h2><div class="grid">${items.map(card).join('\n')}</div></section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Галерея картинок Klockowo</title>
<style>
:root{--ink:#1f2433;--mute:#667;--line:#dde3ee;--paper:#f4f6fb;--card:#fff;--redo:#c2410c;--check:#a16207}
*{box-sizing:border-box}body{margin:0;font:15px/1.45 system-ui,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
header{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid var(--line);padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
h1{font-size:20px;margin:0}header p{margin:0;color:var(--mute)}.tools{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}
button{font:inherit;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 12px;min-height:40px;cursor:pointer}button[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
nav{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px}nav a{color:var(--ink);text-decoration:none;background:#fff;border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:13px}
main{padding:0 16px 40px}section{scroll-margin-top:110px}h2{font-size:17px;margin:22px 0 10px}h2 small{color:var(--mute);font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:2px}
.card.scene{grid-column:span 2}.card.flag-redo{border:2px solid var(--redo)}.card.flag-check{border:2px solid var(--check)}
.pic{aspect-ratio:1;border-radius:8px;display:grid;place-items:center;overflow:hidden;background:var(--bg)}.scene .pic{aspect-ratio:16/9}
.pic img{width:100%;height:100%;object-fit:contain;display:block}.scene .pic img{object-fit:cover}
body[data-bg=checker]{--bg:repeating-conic-gradient(#e6e9f0 0 25%,#fff 0 50%) 0 0/20px 20px}body[data-bg=dark]{--bg:#2c3450}body[data-bg=sky]{--bg:linear-gradient(#8fd3ff,#d9f1ff)}body[data-bg=grass]{--bg:#7cc36a}
.id{margin:4px 0 0;font:600 13px ui-monospace,Consolas,monospace;word-break:break-all}.meta{margin:0;color:var(--mute);font-size:12px}
.note{margin:4px 0 0;font-size:13px}.note.redo{color:var(--redo)}.note.check{color:var(--check)}
.redo{margin-top:auto;padding-top:6px;font-size:13px;display:flex;gap:6px;align-items:center;min-height:32px}
body.only-marked .card:not(.flag-redo):not(.flag-check):not(.marked){display:none}.card.marked{outline:3px solid var(--redo);outline-offset:-3px}
@media (max-width:520px){header{position:static}section{scroll-margin-top:0}.grid{grid-template-columns:repeat(2,1fr)}.card.scene{grid-column:span 2}}
</style></head>
<body data-bg="checker">
<header><h1>Галерея картинок Klockowo</h1>
<p>${total} з ${ASSETS.length} · ${(bytes / 1048576).toFixed(1)} МБ · позначок перевірки: ${marks.redo} перегенерувати, ${marks.check} глянути</p>
<div class="tools">
<button data-bg="checker" aria-pressed="true">Шахівка</button><button data-bg="dark">Темне</button><button data-bg="sky">Небо</button><button data-bg="grass">Трава</button>
<button id="only">Лише позначені</button><button id="copy">Копіювати список</button></div></header>
<nav>${SETS.map((s) => `<a href="#set-${s.key}">${esc(s.title)}</a>`).join('')}</nav>
<main>${sections}</main>
<script>
const KEY = 'klockowo-gallery-redo';
let saved; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { saved = null; }
const boxes = [...document.querySelectorAll('[data-redo]')];
const sync = () => { boxes.forEach((b) => b.closest('.card').classList.toggle('marked', b.checked));
  try { localStorage.setItem(KEY, JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.dataset.redo))); } catch {} };
boxes.forEach((b) => { b.checked = saved ? saved.includes(b.dataset.redo) : b.hasAttribute('data-suggest'); b.addEventListener('change', sync); });
sync();
document.querySelectorAll('button[data-bg]').forEach((btn) => btn.addEventListener('click', () => {
  document.body.dataset.bg = btn.dataset.bg;
  document.querySelectorAll('button[data-bg]').forEach((x) => x.setAttribute('aria-pressed', x === btn));
}));
const only = document.getElementById('only');
only.addEventListener('click', () => only.setAttribute('aria-pressed', document.body.classList.toggle('only-marked')));
document.getElementById('copy').addEventListener('click', async (e) => {
  const list = boxes.filter((b) => b.checked).map((b) => b.dataset.redo).join('\\n') || '(нічого не позначено)';
  try { await navigator.clipboard.writeText(list); e.target.textContent = 'Скопійовано'; } catch { prompt('Список:', list); }
  setTimeout(() => { e.target.textContent = 'Копіювати список'; }, 1500);
});
</script>
</body></html>
`;

writeFileSync(new URL('design/v2/gallery.html', root), html);
console.log(`design/v2/gallery.html: ${total} з ${ASSETS.length}, ${(bytes / 1048576).toFixed(1)} МБ; перегенерувати ${marks.redo}, глянути ${marks.check}`);

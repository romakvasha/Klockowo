// Сторінка-пакет запитів для Gemini → design/v2/prompts.html. Та сама сторінка публікується артефактом на claude.ai:
// там біля кожного запиту є «Додати картинку» — файл лягає в сховище артефакту, запис про нього — у колекцію `art`
// ({asset, w, h, bytes, type, name, at}; w×h — розмір оригіналу). Локальна копія вміє лише копіювати запити й імена файлів.
// Запуск: node tools/art/pack.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { ASSETS, ITEM_FACES, SETS } from './assets.mjs';

const read = (f) => readFileSync(new URL(`pack/${f}`, import.meta.url), 'utf8');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const BRICKS = ['red', 'yellow', 'blue', 'green', 'orange', 'violet'];

function ref(r) {
  const photo = r.startsWith('cut/');
  const name = r.replace(/^cut\//, '');
  const gen = photo ? '' : ` data-gen="${esc(name.replace(/\.png$/, ''))}"`;
  const img = photo ? `<img src="${esc(r)}" alt="">` : '<img alt="" hidden>';
  return `<figure class="ref"${gen} data-src="${esc(r)}" data-name="${esc(name)}">${img}`
    + `<figcaption><code>${esc(name)}</code><button type="button" class="save" hidden>Зберегти</button></figcaption></figure>`;
}

function card(a, n) {
  const label = a.refs.length ? `Прикріпити${a.edit ? ' — це правка' : ''}` : 'Без зразка';
  return `<article class="card" id="${a.id}" data-id="${a.id}" data-scene="${a.cut ? 0 : 1}">
<header class="card-head"><span class="n">${n}</span><code class="fname">${a.id}.png</code><span class="state">чекає</span></header>
<div class="refs"><span class="label">${label}</span>${a.refs.map(ref).join('')}</div>
<pre class="prompt" id="p-${a.id}">${esc(a.prompt)}</pre>
<div class="actions"><button type="button" class="btn primary" data-copy-from="p-${a.id}">Копіювати запит</button><button type="button" class="btn" data-copy="${a.id}.png">Копіювати ім'я</button><label class="btn up" hidden><input type="file" accept="image/png,image/jpeg,image/webp" data-up>Додати картинку</label></div>
<p class="msg" hidden></p>
<div class="result" hidden><img alt="Готова картинка ${a.id}"><span class="meta"></span></div>
</article>`;
}

let n = 0;
const sections = SETS.map((s, i) => {
  const items = ASSETS.filter((a) => a.set === s.key);
  return `<section class="set" id="set-${s.key}" data-set="${s.key}" style="--brick: var(--${BRICKS[i % BRICKS.length]})">
<div class="set-head"><h2>${esc(s.title)}</h2><span class="count"><b data-done>0</b> / ${items.length}</span><span class="studs" aria-hidden="true">${'<i></i>'.repeat(items.length)}</span></div>
<p class="note">${esc(s.note)}</p>
<div class="cards">${items.map((a) => card(a, ++n)).join('\n')}</div>
</section>`;
}).join('\n');

const nav = SETS.map((s) => `<a href="#set-${s.key}">${esc(s.title)} <span data-nav="${s.key}"></span></a>`).join('');

const html = `<title>Пакет картинок Klockowo</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;600;700&family=Rubik:wght@500;700&display=swap">
<style>
${read('page.css')}</style>
<main class="wrap">
<header class="top">
<h1>Пакет картинок Klockowo</h1>
<p class="total"><b id="done">0</b> з ${ASSETS.length} готово <span id="usage"></span></p>
<p class="mode" id="mode">Перевіряю, чи можна додавати картинки просто тут…</p>
</header>
<details class="howto" open><summary>Як працювати</summary>
<ol>
<li>У Gemini — той самий режим, що й для проби (Łatka, фон W4). Одна група — один новий чат; іди згори вниз: перші картинки групи стають зразками для наступних.</li>
<li>На картці: <b>Копіювати запит</b> → встав у Gemini → прикріпи файли з рядка «Прикріпити» (зразок можна просто перетягнути зі сторінки в Gemini або натиснути «Зберегти») → надішли.</li>
<li>Вдала — завантаж <b>оригінал</b> кнопкою завантаження в Gemini (з підпискою Pro це 2K; не скриншот і не копія з чату) і натисни <b>Додати картинку</b> на цій картці. Невдала — напиши в Gemini «try again» або що виправити: «make the background plain white», «remove the text».</li>
<li>Перевір: видно всю фігуру й нічого не обрізано краєм; тло однотонне; жодних літер і логотипів, пупирці гладкі; Kubik той самий (вуха, плями, синій нашийник, жовта цеглинка); на руках рівно стільки пальців, скільки в назві.</li>
<li>Прозоре тло не проси: Gemini малює «шахівку». Тло я виріжу сам.</li>
</ol>
<p class="offline-only">Ця копія відкрита не з claude.ai, тож кнопки «Додати картинку» немає: збережи файл під іменем із картки (<b>Копіювати ім'я</b>) у папку <code>design/v2/gen/</code>.</p>
<p class="fine">Предмети для лічби — ${ITEM_FACES ? 'з обличчями' : 'без облич (у сонечка, метелика, каченяти й рибки — лише очі)'}. Запити англійською: так Gemini розуміє точніше.</p>
</details>
<nav class="sets">${nav}</nav>
${sections}
</main>
<script>
${read('page.js')}</script>
`;

writeFileSync(new URL('../../design/v2/prompts.html', import.meta.url), html);
console.log(`design/v2/prompts.html: ${ASSETS.length} картинок у ${SETS.length} наборах`);

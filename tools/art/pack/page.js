// Сторінка-пакет: копіювання запитів скрізь; в артефакті на claude.ai — ще й «Додати картинку»
// (файл → WebP ≤ 3072 px → сховище артефакту, запис → колекція `art`) і «Зберегти» для зразків.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const MAX_SIDE = 3072;
  const ERR = {
    too_large: 'Файл завеликий (понад 20 МБ).',
    unsupported_type: 'Цей файл не підходить: потрібен PNG, JPG або WebP.',
    quota_or_state: 'Сховище сторінки заповнене. Скажи про це Claude.',
    rate_limited: 'Забагато за раз. Спробуй за хвилину.',
    not_granted: 'Немає дозволу додавати картинки.',
  };
  let db = null, assets = null, downloads = null, rows = {};

  const cardOf = (id) => document.getElementById(id);
  function flash(btn, text) {
    const old = btn.dataset.label || btn.textContent;
    btn.dataset.label = old;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1600);
  }
  function select(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }

  document.addEventListener('click', async (e) => {
    const copy = e.target.closest('[data-copy], [data-copy-from]');
    if (copy) {
      const el = copy.dataset.copyFrom ? document.getElementById(copy.dataset.copyFrom) : $('.fname', copy.closest('.card'));
      try {
        await navigator.clipboard.writeText(copy.dataset.copy ?? el.textContent);
        flash(copy, 'Скопійовано ✓');
      } catch {
        select(el);
        flash(copy, 'Виділено: натисни Ctrl+C');
      }
      return;
    }
    const save = e.target.closest('.ref .save');
    if (save) saveRef(save.closest('.ref'), save);
  });

  async function saveRef(fig, btn) {
    const row = fig.dataset.gen ? rows[fig.dataset.gen] : null;
    const url = fig.dataset.gen ? row && '/_blob/' + row.asset : fig.dataset.src;
    if (!url || !downloads) return;
    try {
      const blob = await (await fetch(url)).blob();
      const ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg' }[blob.type] || 'png';
      await downloads.save({ filename: fig.dataset.name.replace(/\.png$/, '.' + ext), data: blob });
    } catch {
      flash(btn, 'Не вдалося');
    }
  }

  /** Перекодовує картинку у WebP (або JPG, якщо браузер не вміє WebP), довша сторона ≤ MAX_SIDE. */
  async function shrink(file) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * k);
    cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const encode = (type) => new Promise((ok) => cv.toBlob(ok, type, 0.95));
    let blob = await encode('image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
    return { blob, w: bmp.width, h: bmp.height };
  }

  function setMsg(card, cls, text) {
    card.classList.remove('busy', 'error');
    if (cls) card.classList.add(cls);
    const msg = $('.msg', card);
    msg.textContent = text || '';
    msg.hidden = !text;
    if (cls === 'busy') $('.state', card).textContent = 'додаю…';
    if (cls === 'error') $('.state', card).textContent = 'помилка';
  }

  async function upload(card, file) {
    const id = card.dataset.id;
    setMsg(card, 'busy');
    try {
      const { blob, w, h } = await shrink(file);
      let res;
      try {
        res = await assets.upload(blob, { type: blob.type });
      } catch (err) {
        if (err?.code !== 'store_unavailable') throw err;
        await new Promise((ok) => setTimeout(ok, 1500));
        res = await assets.upload(blob, { type: blob.type });
      }
      const old = rows[id]?.asset;
      await db.doc('art/' + id).set({ asset: res.id, w, h, bytes: res.sizeBytes, type: res.contentType, name: file.name, at: new Date().toISOString() });
      if (old && old !== res.id) assets.delete(old).catch(() => {});
      setMsg(card, null);
      usage();
    } catch (err) {
      setMsg(card, 'error', ERR[err?.code] || 'Не вдалося додати. Спробуй ще раз.');
    }
  }

  document.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-up]');
    const file = input?.files?.[0];
    if (!file || !assets || !db) return;
    input.value = '';
    upload(input.closest('.card'), file);
  });

  function render() {
    let total = 0;
    for (const set of $$('.set')) {
      let done = 0;
      const studs = $$('.studs i', set);
      $$('.card', set).forEach((card, i) => {
        const r = rows[card.dataset.id];
        card.classList.toggle('done', !!r);
        if (!card.classList.contains('busy') && !card.classList.contains('error')) $('.state', card).textContent = r ? 'готово ✓' : 'чекає';
        studs[i]?.classList.toggle('on', !!r);
        const box = $('.result', card);
        box.hidden = !r;
        if (!r) return;
        done++;
        const img = $('img', box);
        const src = '/_blob/' + r.asset;
        if (img.getAttribute('src') !== src) img.src = src;
        const scene = card.dataset.scene === '1';
        const small = scene ? r.w < 1600 : Math.max(r.w, r.h) < 1000;
        $('.meta', box).innerHTML = `${r.w}×${r.h} px${small ? ` · <span class="bad">${scene ? 'вузьке: потрібно ≥ 1600 px завширшки' : 'замале'}</span>` : ''}`;
      });
      total += done;
      $('[data-done]', set).textContent = done;
      const nav = $(`[data-nav="${set.dataset.set}"]`);
      if (nav) nav.textContent = done ? `${done}/${studs.length}` : '';
    }
    $('#done').textContent = total;
    for (const fig of $$('.ref[data-gen]')) {
      const r = rows[fig.dataset.gen];
      const img = $('img', fig);
      fig.classList.toggle('missing', !r);
      img.hidden = !r;
      if (r && img.getAttribute('src') !== '/_blob/' + r.asset) img.src = '/_blob/' + r.asset;
      $('.save', fig).hidden = !(r && downloads);
    }
  }

  async function usage() {
    if (!assets) return;
    try {
      const { usage: u } = await assets.list();
      const mb = (b) => Math.round(b / 1048576);
      $('#usage').textContent = `· сховище: ${u.files} файлів, ${mb(u.bytes)} МБ з ${mb(u.maxBytes)} МБ`;
    } catch { /* лічильник необов'язковий */ }
  }

  (async () => {
    const mode = $('#mode');
    const claude = window.claude;
    if (!claude?.use) {
      mode.textContent = 'Локальна копія: копіюй запити, а файли зберігай у design/v2/gen/.';
      return;
    }
    [db, assets, downloads] = await Promise.all(['db', 'assets', 'downloads'].map((name) => claude.use(name)));
    if (downloads) $$('.ref:not([data-gen]) .save').forEach((b) => { b.hidden = false; });
    if (!db || !assets) {
      mode.textContent = 'Додавати картинки тут не можна: копіюй запити, а файли зберігай у design/v2/gen/.';
      return;
    }
    document.body.classList.add('live');
    mode.textContent = 'Готові картинки додавай прямо на картки: Claude забере їх звідси сам.';
    $$('.btn.up').forEach((l) => { l.hidden = false; });
    db.collection('art').onSnapshot((snap) => {
      rows = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
      render();
    }, () => { mode.textContent = 'Не вдалося прочитати збережені картинки. Онови сторінку.'; });
    usage();
  })();
})();

#!/usr/bin/env node
// Unpacks the Claude Design "bundler" exports (design/*.html) into design/extracted/.
//
//   node design/tools/unpack.mjs
//
// Output (deterministic, the folder is wiped and rebuilt on every run):
//   extracted/pages/<etap>/NN-slug.html   board templates (fonts stripped, refs -> svg/…)
//   extracted/boards.json                 board list: etap, index, title, size, file
//   extracted/svg/<group>/<name>.svg      every SVG asset, named via tools/names.json
//   extracted/svg/{icons,digits,logo}/    inline sprites lifted out of the boards
//   extracted/tokens.css                  the design's own tokens block, verbatim
// No dependencies; Node >= 18. Fonts and the design tool's JS runtime are NOT extracted.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const designDir = path.resolve(here, '..');
const outDir = path.join(designDir, 'extracted');
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'names.json'), 'utf8'));

const grab = (html, type) => {
  const open = `<script type="__bundler/${type}">`;
  const i = html.indexOf(open);
  if (i < 0) return null;
  return html.slice(i + open.length, html.indexOf('</script>', i + open.length));
};

function readBundle(html) {
  const manifest = JSON.parse(grab(html, 'manifest') ?? '{}');
  const assets = {};
  for (const [uuid, e] of Object.entries(manifest)) {
    let buf = Buffer.from(e.data, 'base64');
    if (e.compressed) buf = zlib.gunzipSync(buf);
    assets[uuid] = { mime: e.mime, buf };
  }
  const template = grab(html, 'template');
  return { assets, order: JSON.parse(grab(html, 'page_order') ?? '[]'), template: template ? JSON.parse(template) : '' };
}

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const slug = (s) => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^(.{1,48})(?:-.*)?$/, '$1');
const write = (rel, data) => {
  const fp = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, data);
};

// Balanced extraction of the element carrying id="…" (inline sprite symbols).
function elementById(src, id) {
  const m = new RegExp(`<(g|path|rect|circle|ellipse|polygon|polyline|line)\\b[^>]*\\sid="${id}"[^>]*>`).exec(src);
  if (!m) return null;
  let end;
  if (m[1] === 'g') {
    let depth = 1;
    const re = /<(\/?)g\b[^>]*>/g;
    re.lastIndex = m.index + m[0].length;
    for (let t; (t = re.exec(src)); ) {
      depth += t[1] ? -1 : 1;
      if (!depth) { end = t.index + t[0].length; break; }
    }
  } else {
    end = m[0].endsWith('/>') ? m.index + m[0].length : src.indexOf(`</${m[1]}>`, m.index) + m[1].length + 3;
  }
  return src.slice(m.index, end);
}

// wipe the contents, not the folder itself (Windows refuses to delete a folder that is some process's cwd)
if (fs.existsSync(outDir)) for (const e of fs.readdirSync(outDir)) fs.rmSync(path.join(outDir, e), { recursive: true, force: true });
const boards = [], seenSvg = new Map(), unsorted = [], sprites = { icons: new Map(), digits: new Map(), logoDefs: null };
let tokensCss = null;

for (const file of fs.readdirSync(designDir).filter((f) => f.endsWith('.html')).sort()) {
  const html = fs.readFileSync(path.join(designDir, file), 'utf8');
  if (!html.includes('__bundler/manifest')) continue;
  const etap = cfg.bundles[file] ?? path.basename(file, '.html').toLowerCase();
  const outer = readBundle(html);

  // board captions + sizes come from the outer board sheet
  const meta = {};
  for (const m of outer.template.matchAll(/<section class="board"><h2>([^<]*)<\/h2><iframe([^>]*)>/g)) {
    const uuid = (m[2].match(/about:blank#([0-9a-f-]{36})/) || [])[1];
    const w = (m[2].match(/width[:="\s]+(\d+)/) || [])[1], h = (m[2].match(/height[:="\s]+(\d+)/) || [])[1];
    meta[uuid] = { title: decode(m[1]), w, h };
  }

  outer.order.forEach((uuid, n) => {
    const page = readBundle(outer.assets[uuid].buf.toString('utf8'));
    let tpl = page.template.replace(/(?:\/\*[^*]*\*\/\s*)?@font-face\s*\{[^}]*\}\s*/g, '');
    for (const [id, a] of Object.entries(page.assets)) {
      const hash = crypto.createHash('sha1').update(a.buf).digest('hex').slice(0, 8);
      let ref;
      if (a.mime === 'image/svg+xml') {
        const name = cfg.svg[hash] ?? `_unsorted/${hash}`;
        if (!cfg.svg[hash] && !unsorted.includes(hash)) unsorted.push(hash);
        if (seenSvg.has(name) && seenSvg.get(name) !== hash) throw new Error(`name clash: ${name}`);
        if (!seenSvg.has(name)) { seenSvg.set(name, hash); write(`svg/${name}.svg`, a.buf); }
        ref = `svg/${name}.svg`;
      } else {
        ref = `omitted:${hash}.${a.mime.split('/')[1].replace(/^javascript$/, 'js').replace(/[^a-z0-9]/gi, '')}`; // fonts, design-tool runtime
      }
      tpl = tpl.split(id).join(ref);
    }

    // inline sprites: icons (ik-*), digits (cy-*), logo (lg-*)
    for (const defs of tpl.matchAll(/<defs\b[^>]*>([\s\S]*?)<\/defs>/g)) {
      for (const [, id] of defs[1].matchAll(/\sid="((?:ik|cy)-[^"]+)"/g)) {
        const el = elementById(defs[1], id);
        if (id.startsWith('ik-') && !sprites.icons.has(id)) sprites.icons.set(id, el);
        if (/^cy-\d$/.test(id) && !sprites.digits.has(id)) sprites.digits.set(id, el);
      }
      if (!sprites.logoDefs && defs[1].includes('id="lg-word"')) sprites.logoDefs = defs[1];
    }
    if (!tokensCss && /<title>[^<]*tokeny/i.test(tpl)) {
      const pre = [...tpl.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map((m) => decode(m[1]));
      if (pre[0]?.includes(':root {')) tokensCss = pre.join('\n');
    }

    const m = meta[uuid] ?? { title: `page ${n}` };
    const shortTitle = m.title.replace(/^\d+[a-z]?\s*·\s*/i, '');
    const rel = `pages/${etap}/${String(n).padStart(2, '0')}-${slug(shortTitle)}.html`;
    const note = `<!-- ${file} · board ${n} "${m.title}" ${m.w ?? '?'}x${m.h ?? '?'} · refs svg/… are relative to design/extracted/ · x-dc, helmet, DCLogic and sc-camel-view-box (= viewBox) are design-tool artifacts, not product code -->`;
    write(rel, tpl.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n${note}`));
    boards.push({ etap, n, title: m.title, size: m.w ? `${m.w}x${m.h}` : null, file: rel });
  });
}

// ---- sprites -> standalone svg files ---------------------------------------
const NS = 'xmlns="http://www.w3.org/2000/svg"';
const stripId = (el) => el.replace(/^(<\w+\b[^>]*?)\sid="[^"]*"/, '$1');
for (const [id, el] of sprites.icons) {
  const body = stripId(el).replace(/#2D2A4A/gi, 'currentColor');
  write(`svg/icons/icon-${id.slice(3)}.svg`, `<svg ${NS} viewBox="0 0 48 48" fill="currentColor">${body}</svg>\n`);
}
for (const [id, el] of sprites.digits) {
  const attrs = (el.match(/^<g\b([^>]*)>/)[1] || '').replace(/\sid="[^"]*"/, '');
  const inner = el.replace(/^<g\b[^>]*>/, '').replace(/<\/g>$/, '');
  write(`svg/digits/digit-${id.slice(3)}.svg`, `<svg ${NS} viewBox="0 0 100 140"${attrs} stroke="currentColor">${inner}</svg>\n`);
}
if (sprites.logoDefs) {
  const logo = (vb, label, use) => `<svg ${NS} viewBox="${vb}" role="img" aria-label="${label}"><defs>${sprites.logoDefs}</defs>${use}</svg>\n`;
  write('svg/logo/klockowo.svg', logo('-6 -14 818 146', 'Klockowo', '<use href="#lg-word"/>'));
  write('svg/logo/klockowo-mono.svg', logo('-6 -14 818 146', 'Klockowo', '<use href="#lg-word-mono" fill="currentColor"/>'));
  write('svg/logo/klockowo-k.svg', logo('-8 -14 118 142', 'Klockowo', '<use href="#lg-K" fill="currentColor"/>'));
}
if (tokensCss) {
  write('tokens.css', `/* EXTRACTED VERBATIM from design board etap1/02 "Tokeny" (Klockowo1.html) by design/tools/unpack.mjs.\n   Used by the design but missing here: --kl-neutral-edge #E3CFA8, --kl-disabled #EDEAF3 (see design/INDEX.md). */\n${tokensCss}\n`);
}
write('boards.json', JSON.stringify(boards, null, 1) + '\n');

const missing = Object.keys(cfg.svg).filter((h) => ![...seenSvg.values()].includes(h));
console.log(`boards: ${boards.length} · svg files: ${seenSvg.size} · icons: ${sprites.icons.size} · digits: ${sprites.digits.size} · logo: ${sprites.logoDefs ? 3 : 0} · tokens.css: ${tokensCss ? 'yes' : 'NO'}`);
if (unsorted.length) console.warn(`unnamed svg (add to names.json): ${unsorted.join(', ')} -> svg/_unsorted/`);
if (missing.length) console.warn(`names.json entries not found in bundles: ${missing.join(', ')}`);

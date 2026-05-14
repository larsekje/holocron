// Build the interactive galaxy-map data from the source galaxy-map PDF.
//
// The PDF (a 2007 fan-made A2 galaxy map, kept in references/ — which is
// gitignored: bulky + copyright-restricted) has a real text layer. We:
//   1. Rasterize page 1 (the main galaxy map) to a PNG basemap via pdftoppm.
//   2. Extract page-1 labels with `pdftotext -bbox` — words carry exact
//      coordinates in the page's point space, so they align to the raster
//      by construction (pixel = point * DPI / 72).
//   3. Parse page 3's alphabetical index (name -> grid reference). That index
//      is the authoritative list of real star systems, so it doubles as the
//      classifier: a page-1 label is a "system" iff it appears in the index,
//      and it inherits the index's grid reference.
//   4. Emit frontend/public/galaxymap/galaxymap.png and
//      frontend/src/data/galaxyMap.generated.json.
//
// Run manually after updating the map: `npm run build:galaxymap` (from
// frontend/). Deliberately NOT wired into pre(build|dev): it needs poppler
// installed and the gitignored source PDF, and the generated artifacts are
// committed, so ordinary builds just use what's checked in. If the PDF or
// poppler is missing this script bails cleanly, leaving those artifacts be.

import { promises as fs, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const TAG = '[galaxymap]';
const RASTER_DPI = 150;

const PDF_PATH = process.env.GALAXYMAP_PDF
  ? path.resolve(process.env.GALAXYMAP_PDF)
  : path.resolve(projectRoot, 'references', 'galaxymap.pdf');
const SOURCE_URL = 'https://wrvh.home.xs4all.nl/galaxymap/galaxymap.pdf';

const publicDir = path.resolve(projectRoot, 'frontend', 'public', 'galaxymap');
const pngOut = path.resolve(publicDir, 'galaxymap.png');
const jsonOut = path.resolve(
  projectRoot, 'frontend', 'src', 'data', 'galaxyMap.generated.json',
);

// ── shell helpers ──────────────────────────────────────────────────────
function run(cmd, args) {
  return execFileSync(cmd, args, {
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function hasBinary(name) {
  try {
    run(process.platform === 'win32' ? 'where' : 'which', [name]);
    return true;
  } catch {
    return false;
  }
}

function bail(reason) {
  console.warn(`${TAG} ${reason} — keeping existing generated artifacts.`);
  process.exit(0);
}

// ── bbox parsing ───────────────────────────────────────────────────────
// `pdftotext -bbox` emits XHTML: a <page width height> with <word
// xMin yMin xMax yMax>TEXT</word> children, coordinates in PDF points.
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseBbox(xml) {
  const pageM = xml.match(/<page width="([\d.]+)" height="([\d.]+)"/);
  const page = pageM
    ? { width: +pageM[1], height: +pageM[2] }
    : { width: 0, height: 0 };
  const words = [];
  const re =
    /<word\s+xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"\s+yMax="([\d.]+)"\s*>([^<]*)<\/word>/g;
  let m;
  while ((m = re.exec(xml))) {
    const text = decodeEntities(m[5]).trim();
    if (!text) continue;
    words.push({
      xMin: +m[1], yMin: +m[2], xMax: +m[3], yMax: +m[4], text,
    });
  }
  return { page, words };
}

function tokenize(s) {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

// ── page 3: alphabetical index → name -> grid reference ────────────────
// Each entry reads "<Name words...> <GridCell>[, <RegionRoman>]". The grid
// cell ([A-Z] then 1-2 digits) is the anchor: per line, walk left to right
// accumulating name words until a grid cell closes an entry, then reset.
// One physical line spans several columns, so it yields several entries.
// Pure numbers are the index's own margin row/section markers — skipped.
const GRID_RE = /^([A-Z])(\d{1,2}),?$/;
const ROMAN_RE = /^[IVXLC]+,?$/;

function normalize(name) {
  return tokenize(name).join(' ');
}

function groupLines(words) {
  const sorted = [...words].sort((a, b) => a.yMin - b.yMin || a.xMin - b.xMin);
  const lines = [];
  for (const w of sorted) {
    const cy = (w.yMin + w.yMax) / 2;
    const h = w.yMax - w.yMin || 10;
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.cy - cy) <= h * 0.5) {
      last.words.push(w);
    } else {
      lines.push({ cy, words: [w] });
    }
  }
  return lines;
}

function parseIndex(words) {
  const index = new Map();
  for (const line of groupLines(words)) {
    const ws = line.words.sort((a, b) => a.xMin - b.xMin);
    let nameParts = [];
    for (let i = 0; i < ws.length; i++) {
      const t = ws[i].text;
      const gm = t.match(GRID_RE);
      if (gm && nameParts.length > 0) {
        const next = ws[i + 1]?.text;
        if (next && ROMAN_RE.test(next)) i++;
        index.set(normalize(nameParts.join(' ')), gm[1] + gm[2]);
        nameParts = [];
        continue;
      }
      if (/^\d+$/.test(t)) continue; // margin row / section number
      nameParts.push(t);
    }
  }
  return index;
}

// ── page 1 ↔ page 3: index-driven system matching ──────────────────────
// Page 3's index is the canonical list of system names, so rather than
// guessing how page-1 words clump we look each index name *up* on page 1:
// find the word that spells its first token, then walk spatially-adjacent
// words (rightward on the same line, or stacked just below — e.g. "Mon"
// over "Calamari") until the whole name is spelled. No greedy merging, so
// distinct neighbouring systems never fuse and multi-line labels work.
const round = (n, d) => Number(n.toFixed(d));

// Is `next` placed where the continuation of a label would sit relative to
// `cur` — immediately right on the same line, or stacked just below and
// roughly left-aligned?
function isAdjacent(cur, next) {
  const h = cur.yMax - cur.yMin || 10;
  const sameLine =
    Math.abs((cur.yMin + cur.yMax) / 2 - (next.yMin + next.yMax) / 2) <= h * 0.5;
  if (sameLine) {
    const gap = next.xMin - cur.xMax;
    return gap >= -2 && gap <= h * 0.9;
  }
  const below = next.yMin - cur.yMax;
  return (
    below >= -h * 0.4 && below <= h * 0.7 &&
    Math.abs(next.xMin - cur.xMin) <= h * 1.6
  );
}

// Walk words from `startIdx`, consuming `targetTokens` in order, hopping
// only to spatially-adjacent words. Returns the word-index chain on a full
// match, else null.
function tryChain(words, startIdx, targetTokens) {
  const start = words[startIdx];
  if (start.used || start.tokens.length > targetTokens.length) return null;
  for (let k = 0; k < start.tokens.length; k++) {
    if (start.tokens[k] !== targetTokens[k]) return null;
  }
  const chain = [startIdx];
  let consumed = start.tokens.length;
  let cur = start;
  while (consumed < targetTokens.length) {
    let next = -1;
    for (let j = 0; j < words.length; j++) {
      const w = words[j];
      if (w.used || chain.includes(j) || !w.tokens.length) continue;
      if (consumed + w.tokens.length > targetTokens.length) continue;
      if (!isAdjacent(cur, w)) continue;
      let ok = true;
      for (let k = 0; k < w.tokens.length; k++) {
        if (w.tokens[k] !== targetTokens[consumed + k]) { ok = false; break; }
      }
      if (ok) { next = j; break; }
    }
    if (next < 0) return null;
    chain.push(next);
    consumed += words[next].tokens.length;
    cur = words[next];
  }
  return chain;
}

function matchSystems(page1Words, index) {
  const words = page1Words.map((w) => ({
    ...w, tokens: tokenize(w.text), used: false,
  }));
  // firstToken -> word indices, for quick candidate lookup.
  const byFirst = new Map();
  words.forEach((w, i) => {
    if (!w.tokens.length) return;
    const k = w.tokens[0];
    if (!byFirst.has(k)) byFirst.set(k, []);
    byFirst.get(k).push(i);
  });

  // Longest names first: claim multi-word labels before a shorter name
  // sharing their first token ("Ord …", "Cor …") can mis-claim the word.
  const entries = [...index.entries()]
    .map(([name, grid]) => ({ grid, tokens: name.split(' ') }))
    .sort((a, b) => b.tokens.length - a.tokens.length);

  const systems = [];
  for (const entry of entries) {
    for (const startIdx of byFirst.get(entry.tokens[0]) ?? []) {
      const chain = tryChain(words, startIdx, entry.tokens);
      if (!chain) continue;
      chain.forEach((i) => (words[i].used = true));
      const boxes = chain.map((i) => words[i]);
      const xMin = Math.min(...boxes.map((b) => b.xMin));
      const yMin = Math.min(...boxes.map((b) => b.yMin));
      const xMax = Math.max(...boxes.map((b) => b.xMax));
      const yMax = Math.max(...boxes.map((b) => b.yMax));
      systems.push({
        // The on-map label, joined from the page-1 words it's spelled with.
        name: boxes.map((b) => b.text).join(' '),
        grid: entry.grid,
        // Label bounding box in PDF points — snapToStars uses it to find the
        // gold star this label belongs to; stripped before the JSON is saved.
        _box: { xMin, yMin, xMax, yMax },
      });
      break; // first spatial match wins
    }
  }
  systems.sort((a, b) => a.name.localeCompare(b.name));
  return systems;
}

// ── snap markers to the gold stars ─────────────────────────────────────
// pdftotext gives us the label box, but the marker should sit on the gold
// star the map draws the system with — placed on whichever side of the
// star there's room (left, right, above, below). Two catches:
//
//  1. The labels are the *same gold* as the stars, so colour can't tell
//     them apart. Shape can: a star rasterizes as a compact ~17px-square
//     gold ring around a white-hot core, so the gold blob's centroid lands
//     on white; label glyphs are narrow (single letters) or wide (merged)
//     and have no white core.
//  2. In a dense cluster several stars fall inside a label's search ring,
//     so a system can grab a neighbour's. We treat it as an assignment
//     problem: collect every (system, star) pair within reach, then match
//     them so the total label-to-star distance is small and each star goes
//     to one system — a greedy seed refined by 2-opt swaps.
//
// Per system we flood-fill every gold blob in a search ring and keep the
// star-shaped ones as candidates; a global assignment pass then pairs them.
// Systems left without a star fall back to their label centre.

// Parse a binary P6 PPM into { width, height, at(x,y) -> [r,g,b] }.
function parsePpm(buf) {
  if (buf[0] !== 0x50 || buf[1] !== 0x36) throw new Error('not a P6 PPM');
  const isWs = (c) => c === 32 || c === 9 || c === 10 || c === 13;
  let p = 2;
  const nums = [];
  while (nums.length < 3) {
    while (p < buf.length && isWs(buf[p])) p++;
    if (buf[p] === 0x23) {
      while (p < buf.length && buf[p] !== 0x0a) p++; // skip a comment line
      continue;
    }
    const s = p;
    while (p < buf.length && !isWs(buf[p])) p++;
    nums.push(Number(buf.toString('ascii', s, p)));
  }
  p++; // single whitespace byte after maxval, then raw pixel data
  const [width, height] = nums;
  return {
    width,
    height,
    at(x, y) {
      const i = p + (y * width + x) * 3;
      return [buf[i], buf[i + 1], buf[i + 2]];
    },
  };
}

// The map's system stars are a desaturated gold; labels are near-white and
// the background blue, so "warm with low blue" isolates the stars.
function isGold(r, g, b) {
  return r >= 150 && g >= 130 && r - b >= 28 && g - b >= 14;
}

// Distance from a point to the nearest edge of a box (0 if inside).
function distToBox(x, y, box) {
  const dx = Math.max(box.x0 - x, 0, x - box.x1);
  const dy = Math.max(box.y0 - y, 0, y - box.y1);
  return Math.hypot(dx, dy);
}

// A near-white pixel — the star's hot core.
function isWhite(r, g, b) {
  return r >= 230 && g >= 230 && b >= 230;
}

// Does a blob look like a system star? Each star rasterizes as a compact,
// roughly-square gold ring (~16-18 px, ~80-90 gold px) drawn around a
// white-hot core — so the gold blob's centroid lands on that white core.
// Label glyphs are the same gold but narrow (single letters) or wide (when
// they touch), and have no white core. Size + a square bbox + a white
// centroid together single out the stars.
function isStarBlob(n, bw, bh, ppm, cx, cy) {
  if (n < 75) return false;
  if (bw < 13 || bh < 13 || bw > 22 || bh > 22) return false;
  if (Math.max(bw, bh) / Math.min(bw, bh) > 1.5) return false;
  let white = 0;
  const ix = Math.round(cx);
  const iy = Math.round(cy);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = ix + dx;
      const y = iy + dy;
      if (x < 0 || y < 0 || x >= ppm.width || y >= ppm.height) continue;
      if (isWhite(...ppm.at(x, y))) white++;
    }
  }
  return white >= 5;
}

function snapToStars(systems, ppm, dpiScale) {
  const RING = 40; // px searched around the label on every side
  const BRIDGE = 2; // px gap the flood-fill may jump (sparkle tips)
  const STAR_SAME = 6; // px — centroids this close are the same physical star

  const labs = systems.map((s) => ({
    x0: s._box.xMin * dpiScale,
    x1: s._box.xMax * dpiScale,
    y0: s._box.yMin * dpiScale,
    y1: s._box.yMax * dpiScale,
  }));

  // ── Phase 1: every star-shaped gold blob within reach of each label ───
  // `stars` is the deduped list of physical stars; `candidates` pairs each
  // system with the stars in its search ring and how far they are.
  const stars = []; // { cx, cy }
  const candidates = []; // { si, starIdx, dist }
  for (let si = 0; si < systems.length; si++) {
    const lab = labs[si];
    const wx0 = Math.max(0, Math.floor(lab.x0 - RING));
    const wy0 = Math.max(0, Math.floor(lab.y0 - RING));
    const ww = Math.min(ppm.width - 1, Math.ceil(lab.x1 + RING)) - wx0 + 1;
    const wh = Math.min(ppm.height - 1, Math.ceil(lab.y1 + RING)) - wy0 + 1;

    // Gold mask for the window.
    const isG = new Uint8Array(ww * wh);
    for (let y = 0; y < wh; y++) {
      for (let x = 0; x < ww; x++) {
        if (isGold(...ppm.at(wx0 + x, wy0 + y))) isG[y * ww + x] = 1;
      }
    }

    // Flood-fill every connected gold blob. BRIDGE lets the fill jump the
    // sparkle's thin points.
    const seen = new Uint8Array(ww * wh);
    for (let sy0 = 0; sy0 < wh; sy0++) {
      for (let sx0 = 0; sx0 < ww; sx0++) {
        if (!isG[sy0 * ww + sx0] || seen[sy0 * ww + sx0]) continue;
        const stack = [[sx0, sy0]];
        seen[sy0 * ww + sx0] = 1;
        let n = 0;
        let ax = 0;
        let ay = 0;
        let bx0 = ww;
        let by0 = wh;
        let bx1 = 0;
        let by1 = 0;
        while (stack.length) {
          const [x, y] = stack.pop();
          n++; ax += x; ay += y;
          if (x < bx0) bx0 = x;
          if (x > bx1) bx1 = x;
          if (y < by0) by0 = y;
          if (y > by1) by1 = y;
          for (let dy = -BRIDGE; dy <= BRIDGE; dy++) {
            for (let dx = -BRIDGE; dx <= BRIDGE; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= ww || ny >= wh) continue;
              const k = ny * ww + nx;
              if (seen[k] || !isG[k]) continue;
              seen[k] = 1;
              stack.push([nx, ny]);
            }
          }
        }
        const cx = wx0 + ax / n;
        const cy = wy0 + ay / n;
        if (!isStarBlob(n, bx1 - bx0 + 1, by1 - by0 + 1, ppm, cx, cy)) continue;

        // Dedup: the same physical star turns up in several systems' windows.
        let starIdx = -1;
        for (let k = 0; k < stars.length; k++) {
          if (
            Math.abs(stars[k].cx - cx) <= STAR_SAME &&
            Math.abs(stars[k].cy - cy) <= STAR_SAME
          ) { starIdx = k; break; }
        }
        if (starIdx < 0) {
          starIdx = stars.length;
          stars.push({ cx, cy });
        }
        candidates.push({ si, starIdx, dist: distToBox(cx, cy, lab) });
      }
    }
  }

  // ── Phase 2: assignment — greedy seed, then 2-opt ─────────────────────
  // Greedy (closest pair first) is a quick start but can paint itself into
  // a corner: hand a system a near star that really belongs to a neighbour
  // and the neighbour is forced onto a far one. 2-opt fixes those
  // inversions — swap two systems' stars whenever the swap lowers the total
  // distance — until no swap helps. Each star is still used at most once.
  const candByStar = new Map(); // si -> Map(starIdx -> dist)
  for (const c of candidates) {
    let m = candByStar.get(c.si);
    if (!m) { m = new Map(); candByStar.set(c.si, m); }
    if (!m.has(c.starIdx) || c.dist < m.get(c.starIdx)) m.set(c.starIdx, c.dist);
  }

  const assigned = new Int32Array(systems.length).fill(-1);
  const starTaken = new Uint8Array(stars.length);
  for (const c of [...candidates].sort((a, b) => a.dist - b.dist)) {
    if (assigned[c.si] >= 0 || starTaken[c.starIdx]) continue;
    assigned[c.si] = c.starIdx;
    starTaken[c.starIdx] = 1;
  }

  for (let pass = 0; pass < 6; pass++) {
    let improved = false;
    for (let a = 0; a < systems.length; a++) {
      if (assigned[a] < 0) continue;
      const ca = candByStar.get(a);
      for (let b = a + 1; b < systems.length; b++) {
        if (assigned[b] < 0) continue;
        const sa = assigned[a]; // re-read: an earlier swap this pass may
        const sb = assigned[b]; // have moved a or b already
        const cb = candByStar.get(b);
        const aTakesB = ca.get(sb);
        const bTakesA = cb.get(sa);
        if (aTakesB === undefined || bTakesA === undefined) continue;
        if (aTakesB + bTakesA < ca.get(sa) + cb.get(sb) - 1e-6) {
          assigned[a] = sb;
          assigned[b] = sa;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  // ── Phase 3: write marker positions ───────────────────────────────────
  let detected = 0;
  for (let si = 0; si < systems.length; si++) {
    const starIdx = assigned[si];
    let px;
    let py;
    if (starIdx >= 0) {
      px = stars[starIdx].cx;
      py = stars[starIdx].cy;
      detected += 1;
    } else {
      px = (labs[si].x0 + labs[si].x1) / 2;
      py = (labs[si].y0 + labs[si].y1) / 2;
    }
    systems[si].x = round(px / ppm.width, 5);
    systems[si].y = round(py / ppm.height, 5);
    delete systems[si]._box;
  }
  return detected;
}

// ── main ───────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(PDF_PATH)) {
    bail(`Source PDF not found at ${path.relative(projectRoot, PDF_PATH)}`);
  }
  if (!hasBinary('pdftoppm') || !hasBinary('pdftotext')) {
    bail('poppler (pdftoppm / pdftotext) not found on PATH');
  }

  // 1. Rasterize page 1 → basemap PNG (web) and PPM (raw RGB for star
  //    detection). `-singlefile` drops the page-number suffix.
  await fs.mkdir(publicDir, { recursive: true });
  run('pdftoppm', [
    '-png', '-singlefile', '-f', '1', '-l', '1', '-r', String(RASTER_DPI),
    PDF_PATH, pngOut.replace(/\.png$/, ''),
  ]);
  const ppmPrefix = path.join(os.tmpdir(), `galaxymap-scan-${process.pid}`);
  run('pdftoppm', [
    '-singlefile', '-f', '1', '-l', '1', '-r', String(RASTER_DPI),
    PDF_PATH, ppmPrefix,
  ]);
  const ppm = parsePpm(await fs.readFile(`${ppmPrefix}.ppm`));
  await fs.rm(`${ppmPrefix}.ppm`, { force: true });

  // 2. Page-1 words.
  const page1 = parseBbox(run('pdftotext', ['-bbox', '-f', '1', '-l', '1', PDF_PATH, '-']));

  // 3. Page-3 index — the canonical system-name list.
  const page3 = parseBbox(run('pdftotext', ['-bbox', '-f', '3', '-l', '3', PDF_PATH, '-']));
  const index = parseIndex(page3.words);

  // 4. Match index names to page-1 labels, then snap each marker from the
  //    label box to the gold star the map draws it with.
  const systems = matchSystems(page1.words, index);
  const starsDetected = snapToStars(systems, ppm, RASTER_DPI / 72);
  const data = {
    image: '/galaxymap/galaxymap.png',
    width: ppm.width,
    height: ppm.height,
    source: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    systems,
  };
  await fs.mkdir(path.dirname(jsonOut), { recursive: true });
  await fs.writeFile(jsonOut, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  const matchRate = index.size
    ? ((systems.length / index.size) * 100).toFixed(1)
    : '0';
  console.log(
    `${TAG} Wrote ${systems.length} systems ` +
    `(${index.size} page-3 index entries, ${page1.words.length} page-1 words, ` +
    `${matchRate}% of index placed; ${starsDetected} snapped to a star) to ` +
    `${path.relative(projectRoot, jsonOut)}; basemap ${data.width}×${data.height} ` +
    `→ ${path.relative(projectRoot, pngOut)}.`,
  );
}

main().catch((err) => {
  console.error(`${TAG} Failed to build galaxy map:`, err);
  process.exit(1);
});

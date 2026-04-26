// Throwaway helper: replicate buildSpotlightIndex.mjs adversary display-name logic
// and dump one display name per line.
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const adversariesDir = path.resolve(projectRoot, 'backend', 'data', 'stoogoff', 'adversaries');

const BOOK_NAMES = {
  eote: 'Edge of the Empire',
  aor: 'Age of Rebellion',
  fad: 'Force and Destiny',
  crb: 'Core Rulebook',
};

const prettifySource = (s) => {
  if (!s) return undefined;
  const key = String(s).toLowerCase().replace(/\.json$/, '');
  if (BOOK_NAMES[key]) return BOOK_NAMES[key];
  const minor = new Set(['of', 'the', 'and', 'in', 'a', 'on', 'to']);
  return key
    .split(/[-_\s]+/)
    .map((w, i) => (i > 0 && minor.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
};

async function listJsonFiles(dirPath) {
  const names = await fs.readdir(dirPath, { withFileTypes: true });
  return names
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .map((e) => path.join(dirPath, e.name));
}

const advFiles = await listJsonFiles(adversariesDir);
const advRaw = [];
for (const file of advFiles) {
  let data;
  try {
    const raw = (await fs.readFile(file, 'utf-8')).replace(/^﻿/, '');
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`parse fail ${path.basename(file)}: ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)) continue;
  const fileSource = prettifySource(path.basename(file, '.json'));
  for (const adv of data) {
    if (!adv?.name) continue;
    const bookTag = (Array.isArray(adv.tags) ? adv.tags : []).find((t) => /^book:/i.test(String(t)));
    const bookCode = bookTag ? String(bookTag).replace(/^book:/i, '').toLowerCase() : null;
    const source = bookCode ? prettifySource(bookCode) : fileSource;
    advRaw.push({ name: adv.name, source });
  }
}

const counts = new Map();
for (const { name } of advRaw) counts.set(name, (counts.get(name) || 0) + 1);

const displayNames = [];
for (const { name, source } of advRaw) {
  const dn = (counts.get(name) || 0) > 1 && source ? `${name} (${source})` : name;
  displayNames.push(dn);
}

// Dedup just in case (file:name combos can collide with same source on duplicates)
const unique = Array.from(new Set(displayNames)).sort((a, b) => a.localeCompare(b));
for (const n of unique) console.log(n);
console.error(`total raw: ${advRaw.length}, unique display: ${unique.length}`);

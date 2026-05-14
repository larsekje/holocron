// Build per-planet reference data from the Planetary Compendium PDF.
//
// The compendium (kept in references/ — gitignored, like the other bulky
// source PDFs) is a tagged, cleanly-structured document: one planet per
// page, each with an all-caps name header, a block of "Key: value" fields
// (Astronavigation Data, Government, Population, Terrain, …) and a prose
// Background section. Because it's tagged, `pdftotext` (no -layout) reads
// its two-column body in correct order, so a plain text dump parses cleanly.
//
// Output: frontend/src/data/planetCompendium.generated.json — the galaxy map
// looks each system up here by name to enrich its popup.
//
// Run manually after updating the source: `npm run build:planets` (from
// frontend/). Not wired into pre(build|dev): needs poppler + the gitignored
// PDF, and the generated JSON is committed. Bails cleanly if either is gone.

import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const TAG = '[planets]';
const PDF_PATH = process.env.PLANETS_PDF
  ? path.resolve(process.env.PLANETS_PDF)
  : path.resolve(projectRoot, 'references', 'planets.pdf');
const jsonOut = path.resolve(
  projectRoot, 'frontend', 'src', 'data', 'planetCompendium.generated.json',
);

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
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
  console.warn(`${TAG} ${reason} — keeping existing generated artifact.`);
  process.exit(0);
}

// The compendium's info-box fields, in document order, mapped to JSON keys.
const FIELDS = [
  ['Astronavigation Data', 'astronav'],
  ['Orbital Metrics', 'orbitalMetrics'],
  ['Government', 'government'],
  ['Population', 'population'],
  ['Languages', 'languages'],
  ['Terrain', 'terrain'],
  ['Major Cities', 'majorCities'],
  ['Areas of Interest', 'areasOfInterest'],
  ['Major Exports', 'majorExports'],
  ['Major Imports', 'majorImports'],
  ['Trade Routes', 'tradeRoutes'],
  ['Special Conditions', 'specialConditions'],
];
const FIELD_RE = new RegExp(`^(${FIELDS.map((f) => f[0]).join('|')}):\\s*(.*)$`);

// Footer markers — where a planet's prose Background ends and the page
// chrome (page number, region class, "Planet Compendium", RARITY, GRID)
// begins.
const FOOTER_RE = /^(\d+|Planet Compendium|RARITY|GRID)$/i;

const ROMAN_RE = /^(?:i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,2})$/i;
function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (ROMAN_RE.test(w) ? w.toUpperCase() : w.replace(/[a-z]/, (c) => c.toUpperCase())))
    .join(' ');
}

// Parse one page's plain-text dump into a planet record, or null if the page
// isn't a planet entry (cover, table of contents, …).
function parsePlanetPage(text) {
  const lines = text.split('\n').map((l) => l.trim());
  // Drop leading blank lines.
  let i = 0;
  while (i < lines.length && !lines[i]) i++;

  // Name: the leading lines before the first field / Background. Planet
  // names occasionally wrap ("ALDERAAN" / "(DESTROYED)").
  const nameParts = [];
  for (; i < lines.length && nameParts.length < 3; i++) {
    const l = lines[i];
    if (!l) continue;
    if (FIELD_RE.test(l) || /^Background:/i.test(l)) break;
    nameParts.push(l);
  }
  if (!nameParts.length) return null;

  const fields = {};
  const background = [];
  let curKey = null;
  let inBackground = false;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/^Background:/i.test(l)) {
      inBackground = true;
      curKey = null;
      const rest = l.replace(/^Background:\s*/i, '');
      if (rest) background.push(rest);
      continue;
    }
    if (inBackground) {
      if (FOOTER_RE.test(l)) break; // hit the page chrome — prose is done
      if (l) background.push(l);
      continue;
    }
    const m = l.match(FIELD_RE);
    if (m) {
      curKey = m[1];
      fields[curKey] = m[2];
    } else if (curKey && l) {
      // Continuation of the current field's wrapped value.
      fields[curKey] += (fields[curKey] ? ' ' : '') + l;
    }
  }

  // Not a planet page unless it actually carried the astrography block.
  if (!fields['Astronavigation Data']) return null;

  const planet = { name: titleCase(nameParts.join(' ')) };
  for (const [label, key] of FIELDS) {
    if (fields[label]) planet[key] = fields[label].replace(/\s+/g, ' ').trim();
  }
  const bg = background.join(' ').replace(/\s+/g, ' ').trim();
  if (bg) planet.background = bg;
  return planet;
}

async function main() {
  if (!existsSync(PDF_PATH)) {
    bail(`Source PDF not found at ${path.relative(projectRoot, PDF_PATH)}`);
  }
  if (!hasBinary('pdftotext')) {
    bail('poppler (pdftotext) not found on PATH');
  }

  // One dump of the whole doc; pages are form-feed separated. No -layout —
  // the PDF is tagged, so plain mode reads the two-column body in order.
  const pages = run('pdftotext', [PDF_PATH, '-']).split('\f');
  const planets = [];
  for (const page of pages) {
    const planet = parsePlanetPage(page);
    if (planet) planets.push(planet);
  }
  planets.sort((a, b) => a.name.localeCompare(b.name));

  const data = {
    source: 'Planetary Compendium (fan compilation, 2023)',
    generatedAt: new Date().toISOString(),
    planets,
  };
  await fs.mkdir(path.dirname(jsonOut), { recursive: true });
  await fs.writeFile(jsonOut, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  const withBg = planets.filter((p) => p.background).length;
  console.log(
    `${TAG} Wrote ${planets.length} planets (${withBg} with background prose) to ` +
    `${path.relative(projectRoot, jsonOut)}.`,
  );
}

main().catch((err) => {
  console.error(`${TAG} Failed to build planet compendium:`, err);
  process.exit(1);
});

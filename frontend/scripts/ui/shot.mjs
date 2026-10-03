#!/usr/bin/env node
// Drive the running dev server in headless Chromium and screenshot it.
//
//   node scripts/ui/shot.mjs <name> [steps.mjs] [--fixture playtest-2026-07-30] [--clip x,y,w,h]
//
// - Loads APP_URL (default http://localhost:8000) — start `npm run dev` first.
// - --fixture seeds localStorage from scripts/ui/fixtures/<name>.json, so the
//   app opens mid-encounter with real data instead of empty.
// - steps.mjs (optional) default-exports `async (page) => {}` to click/type.
// - Writes scripts/ui/out/<name>.png and prints console errors/warnings.
//
// Needs Playwright, which is NOT a project dependency (keeps the lockfile
// lean):  npm i --no-save playwright && npx playwright install chromium
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const fixture = opt('fixture');
const clipArg = opt('clip');
const [name = 'shot', stepsFile] = args;
const url = process.env.APP_URL ?? 'http://localhost:8000/';

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));

await page.goto(url);
if (fixture) {
  const seed = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', `${fixture}.json`), 'utf8'));
  await page.evaluate((seed) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
  }, seed);
  await page.reload();
}
await page.waitForTimeout(1500);
if (stepsFile) {
  const mod = await import(path.resolve(stepsFile));
  await mod.default(page);
}
const outDir = path.join(here, 'out');
fs.mkdirSync(outDir, { recursive: true });
const clip = clipArg ? (([x, y, width, height]) => ({ x, y, width, height }))(clipArg.split(',').map(Number)) : undefined;
const file = path.join(outDir, `${name}.png`);
await page.screenshot({ path: file, clip });
console.log(`screenshot: ${file}`);
// The adversary fetch needs the backend; it's noise for UI checks.
const shown = logs.filter((l) => !/Error loading adversaries/.test(l));
if (shown.length) console.log(shown.slice(0, 30).join('\n'));
await browser.close();

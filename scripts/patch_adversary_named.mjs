// Patch frontend/public/assets/data/adversaries.json by overlaying the curated
// labels in named_character_labels.txt onto each entry's `named` field.
//
// Source-of-truth labels live in named_character_labels.txt at the repo root,
// in `<y|n>\t<display name>\n` form. The display-name format includes a
// " (Source)" suffix for entries that were duplicated in the upstream data;
// we strip that to get the bare name used by the curated dataset.
//
// Behaviour: for each adversary in the JSON, look up its `name` against the
// label set. If the label is unambiguous we set `named` accordingly. If a
// name has conflicting labels across its display-name variants, or if it is
// missing from the labels file entirely, we leave the existing `named` value
// alone — no regressions on entries we never classified.

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const labelsPath = path.resolve(projectRoot, 'named_character_labels.txt');
const dataPath = path.resolve(projectRoot, 'frontend', 'public', 'assets', 'data', 'adversaries.json');

const stripSuffix = (s) => s.replace(/ \([^)]+\)$/, '');

async function main() {
  const labelsRaw = await fs.readFile(labelsPath, 'utf-8');
  const labelMap = new Map(); // bare-name -> 'y' | 'n' | 'ambig'
  let labelLines = 0;
  for (const line of labelsRaw.split('\n')) {
    if (!line.trim()) continue;
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const label = line.slice(0, tab).trim().toLowerCase();
    if (label !== 'y' && label !== 'n') continue;
    const bare = stripSuffix(line.slice(tab + 1));
    labelLines++;
    const existing = labelMap.get(bare);
    if (!existing) labelMap.set(bare, label);
    else if (existing !== label) labelMap.set(bare, 'ambig');
  }

  const advRaw = await fs.readFile(dataPath, 'utf-8');
  const adversaries = JSON.parse(advRaw);

  let updated = 0;
  let unchanged = 0;
  let unmatched = 0;
  let ambiguous = 0;
  let flippedTrueToFalse = 0;
  let flippedFalseToTrue = 0;

  for (const adv of adversaries) {
    if (!adv?.name) continue;
    // Source names also occasionally carry the " (Variant)" suffix
    // (e.g. "Ahsoka Tano (Fulcrum)"), so try the bare form too.
    const lookup = labelMap.get(adv.name) ?? labelMap.get(stripSuffix(adv.name));
    if (!lookup) {
      unmatched++;
      continue;
    }
    if (lookup === 'ambig') {
      ambiguous++;
      continue;
    }
    const desired = lookup === 'y';
    const current = adv.named === true;
    if (current === desired) {
      unchanged++;
      continue;
    }
    if (current && !desired) flippedTrueToFalse++;
    else if (!current && desired) flippedFalseToTrue++;
    adv.named = desired;
    updated++;
  }

  await fs.writeFile(dataPath, JSON.stringify(adversaries, null, 2) + '\n', 'utf-8');

  console.log(`labels read:           ${labelLines}`);
  console.log(`bare names in labels:  ${labelMap.size}`);
  console.log(`adversary entries:     ${adversaries.length}`);
  console.log(`  matched + updated:   ${updated}`);
  console.log(`    true → false:      ${flippedTrueToFalse}`);
  console.log(`    false → true:      ${flippedFalseToTrue}`);
  console.log(`  matched + unchanged: ${unchanged}`);
  console.log(`  ambiguous (skipped): ${ambiguous}`);
  console.log(`  unmatched (skipped): ${unmatched}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

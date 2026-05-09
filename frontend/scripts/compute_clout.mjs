// Compute a 1-5 "clout" rating for every adversary in adversaries.json and write
// the {name → clout} map to frontend/src/data/adversaryClout.generated.json.
//
// Clout is the FFG/SWRPG "create-an-adversary on the fly" summary number — the
// adversary's default characteristic, common dice pool size, and common
// difficulty against, all rolled into one. Formula:
//
//   clout = max(round(median over ranked skills of max(char, rank)),
//               2 + Adversary N,
//               2 + Nobody's Fool N,
//               Force Rating - 1)
//   clamped to 1-5, with Minion ≤ 3 and Nemesis ≥ 3 sanity caps.
//
// Runs at predev / prebuild time via the build:spotlight chain, so the file
// stays in sync with adversaries.json.

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const inFile = path.resolve(projectRoot, 'frontend', 'public', 'assets', 'data', 'adversaries.json');
const outFile = path.resolve(projectRoot, 'frontend', 'src', 'data', 'adversaryClout.generated.json');

const SKILL_CHAR = {
  Brawl: 'Brawn', Melee: 'Brawn', Resilience: 'Brawn', Athletics: 'Brawn',
  'Ranged: Light': 'Agility', 'Ranged: Heavy': 'Agility', Gunnery: 'Agility',
  Coordination: 'Agility', Stealth: 'Agility',
  'Piloting: Planetary': 'Agility', 'Piloting: Space': 'Agility',
  Astrogation: 'Intellect', Computers: 'Intellect', Mechanics: 'Intellect',
  Medicine: 'Intellect', Education: 'Intellect',
  Charm: 'Presence', Leadership: 'Presence', Negotiation: 'Presence', Cool: 'Presence',
  Coercion: 'Willpower', Discipline: 'Willpower', Vigilance: 'Willpower',
  Deception: 'Cunning', Perception: 'Cunning', Skulduggery: 'Cunning',
  Streetwise: 'Cunning', Survival: 'Cunning',
};

function charForSkill(skill, chars) {
  if (skill.startsWith('Knowledge')) return chars.Intellect || 0;
  // Skills with explicit characteristic override in parentheses (e.g. "Lightsaber (Willpower)").
  const m = skill.match(/^([^(]+)\s*\((Brawn|Agility|Intellect|Cunning|Willpower|Presence)\)/);
  if (m) return chars[m[2]] || 0;
  if (skill.startsWith('Lightsaber')) return chars.Brawn || 0;
  const c = SKILL_CHAR[skill];
  if (c) return chars[c] || 0;
  return 0;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Pull "Adversary 4" → 4 (or 0). Skips "Starship Adversary" — that one only
// applies in vehicle combat and shouldn't lift a personal-clout score.
function parseTalentRank(talents, key) {
  let max = 0;
  const re = new RegExp(`^${key.replace(/'/g, "[''’]")}\\s+(\\d+)`, 'i');
  for (const t of talents || []) {
    if (typeof t !== 'string') continue;
    if (key === 'Adversary' && /Starship Adversary/i.test(t)) continue;
    const m = t.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

function cloutFor(a) {
  const chars = a.characteristics || {};
  const skills = a.skills || {};

  const pools = [];
  for (const [skill, rank] of Object.entries(skills)) {
    const charVal = charForSkill(skill, chars);
    pools.push(Math.max(charVal, rank || 0));
  }

  const med = pools.length ? Math.round(median(pools)) : 1;
  const adv = parseTalentRank(a.talents, 'Adversary');
  const nf = parseTalentRank(a.talents, "Nobody's Fool");
  const fr = parseTalentRank(a.talents, 'Force Rating');

  const advFloor = adv >= 1 ? 2 + adv : 0;
  const nfFloor = nf >= 1 ? 2 + nf : 0;
  const frFloor = fr >= 2 ? fr - 1 : 0;

  let clout = Math.max(med, advFloor, nfFloor, frFloor);

  if (a.type === 'Minion') clout = Math.min(clout, 3);
  if (a.type === 'Nemesis') clout = Math.max(clout, 3);

  return Math.max(1, Math.min(5, clout));
}

async function main() {
  let raw;
  try {
    raw = await fs.readFile(inFile, 'utf-8');
  } catch (e) {
    console.warn(`[clout] Adversary data missing at ${path.relative(projectRoot, inFile)}: ${e.message}`);
    const existing = await fs.readFile(outFile, 'utf-8').catch(() => null);
    if (existing && existing.trim().length > 2) {
      console.warn(`[clout] Keeping existing map at ${path.relative(projectRoot, outFile)}.`);
      return;
    }
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, '{}\n', 'utf-8');
    return;
  }

  const advs = JSON.parse(raw.replace(/^﻿/, ''));
  const out = {};
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const a of advs) {
    if (!a?.name) continue;
    const c = cloutFor(a);
    out[a.name] = c;
    dist[c]++;
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(
    `[clout] Wrote ${Object.keys(out).length} entries (1:${dist[1]} 2:${dist[2]} 3:${dist[3]} 4:${dist[4]} 5:${dist[5]}) to ${path.relative(projectRoot, outFile)}.`,
  );
}

main().catch((err) => {
  console.error('[clout] Failed:', err);
  process.exit(1);
});

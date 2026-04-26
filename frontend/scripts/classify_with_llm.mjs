// Use Claude Opus 4.7 to classify each adversary into ONE core archetype
// from the user's canonical 22-archetype list. The result is written back to
// frontend/public/assets/data/adversaries.json as the `coreArchetype` field.
//
// - Resumable: by default, skips entries that already have a valid coreArchetype.
//   Pass --force to reclassify everything.
// - Prompt-cached: the long system prompt (instructions + 22 archetype list +
//   anchor examples) is sent with cache_control so subsequent batches read
//   from cache at ~10% of base cost. ~80% savings in practice.
// - Structured outputs: response is constrained to a JSON schema with an
//   `enum` of the 22 archetype names, so Claude can't return anything off-list.
// - Saved after each batch: a crash mid-run doesn't waste prior progress.
//
// Usage:
//   cd frontend && npm install @anthropic-ai/sdk
//   export ANTHROPIC_API_KEY=...
//   node scripts/classify_with_llm.mjs           # only classify missing/invalid entries
//   node scripts/classify_with_llm.mjs --force   # reclassify all (recommended for first run after the heuristic pass)

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const dataPath = path.resolve(projectRoot, 'frontend', 'public', 'assets', 'data', 'adversaries.json');

const force = process.argv.includes('--force');
const BATCH_SIZE = 25;
const MODEL = 'claude-opus-4-7';

export const CORE_ARCHETYPES = [
  // Combat
  'Gunslinger',
  'Marksman',
  'Heavy Hitter',
  'Melee Bruiser',
  'Ace Pilot',
  'Force Duelist',
  'Force Savant',
  'Nasty Beast',
  'Persistent Pest',
  'Techno Wizard',
  'Shadow Operative',
  'Guns for Hire',
  'Saboteur',
  // Social
  'Sycophant',
  'Smooth Talker',
  'Bureaucrat / Enforcer',
  'Fixer',
  'Schemer',
  'Power Broker',
  'Socialite',
  'Mentor',
  'Mystic',
];

const VALID = new Set(CORE_ARCHETYPES);

const SYSTEM_PROMPT = `You are classifying Star Wars RPG (FFG/Edge of the Empire/Age of Rebellion/Force and Destiny) adversaries into ONE core archetype that best captures their iconic role as a character.

# The 22 archetypes

## Combat / Action-Oriented (13)

- **Gunslinger** — Agile blaster duelist. Heroic shooter, stylish, mobile.
- **Marksman** — Precision long-range shooter. Snipers, scouts with rifles.
- **Heavy Hitter** — Brute-force fighter; raw power or heavy weapons. Wookiees with bowcasters, troopers with heavy weapons.
- **Melee Bruiser** — Close-combat specialist; hand-to-hand or blade expert, NON-Force. Brawlers, vibroblade fighters.
- **Ace Pilot** — Starship or vehicle specialist; daring and skilled. Iconic pilots, vehicle aces.
- **Force Duelist** — Lightsaber or Force melee combatant; duelling style. Jedi/Sith with lightsabers.
- **Force Savant** — Non-melee Force user; control, manipulation, ranged Force attacks. Force users who don't lightsaber-duel.
- **Nasty Beast** — Predator, alien, or monstrous threat; natural danger. Rancors, krayt dragons, sand monsters.
- **Persistent Pest** — Weak or numerous foes; swarmers, minions, nuisances. Stormtrooper squads, B1 droids, generic mooks.
- **Techno Wizard** — Slicer, engineer, or robotic combatant; tech-driven battlefield control. Astromechs, hackers, gadget specialists.
- **Shadow Operative** — Stealthy, covert; assassins, infiltrators, slicer-spies. Specforce infiltrators, spies, assassins.
- **Guns for Hire** — Contracted combatants; mercenaries, freelance bounty hunters. Boba Fett, Mando-style mercs, hired muscle.
- **Saboteur** — Demolitions, disruption, hit-and-run. Insurgents, infiltrators with explosives.

## Social / Noncombat (9)

- **Sycophant** — Obedient minion or yes-man. Toadies, hangers-on, weak servants.
- **Smooth Talker** — Charming, persuasive, roguish; gamblers, con artists, negotiators. C-3PO, charming rogues, talkers.
- **Bureaucrat / Enforcer** — Official authority; enforces laws and regulations. Customs officers, mid-rank Imperial officials, planetary governors.
- **Fixer** — Merchant, information broker, behind-the-scenes facilitator. Underworld dealers, info brokers, smugglers.
- **Schemer** — Covert manipulator; pulls strings behind the scenes. Senators, master manipulators, plotters.
- **Power Broker** — Influences others openly; controls resources, networks, factions. Crime lords, Hutts, Senators-in-public, faction leaders.
- **Socialite** — High-status influencer; charm and connections in elite circles. Nobles, court figures, courtiers.
- **Mentor** — Guides, advises, or trains others. Wise teachers, healers, advisors.
- **Mystic** — Inspires devotion; ideological, spiritual, or cultic authority. Nightsister matriarchs, cult leaders, prophets.

# Rules

- Pick exactly ONE archetype per adversary — the one that best defines their iconic role, NOT a list of things they could do.
- **Tier short-circuits:**
  - **Minion** tier: almost always "Persistent Pest" (they're swarmers/mooks). Exception: dangerous creature minions can be "Nasty Beast"; otherwise "Persistent Pest".
  - **Rival**/**Nemesis**: pick by character role; tier doesn't constrain the choice.
- **Force users:** Lightsaber/melee → Force Duelist; non-melee Force user → Force Savant.
- **Iconic anchors** (use these to calibrate edge calls):
  - Darth Vader → Force Duelist
  - Luke Skywalker → Force Duelist
  - Plo Koon → Force Duelist
  - Asajj Ventress → Force Duelist
  - Mother Talzin → Mystic (non-melee Force user with cult authority — Mystic beats Force Savant when there's overt religious leadership)
  - Han Solo → Gunslinger
  - Chewbacca → Heavy Hitter
  - Boba Fett → Guns for Hire
  - Bossk → Guns for Hire
  - IG-88 → Marksman
  - Cassian Andor → Shadow Operative
  - Sergeant Hunter / Crosshair → Marksman
  - Wrecker → Heavy Hitter
  - Captain Phasma → Heavy Hitter (combat-leaning Imperial commander)
  - Jabba the Hutt → Power Broker (crime lord, not a fighter)
  - Hondo Ohnaka → Power Broker
  - Mon Mothma → Power Broker (rebel leader)
  - Bail Organa → Power Broker
  - Senator Lott Dod → Schemer
  - Wat Tambor → Schemer (Separatist scheming, not a tech archetype)
  - C-3PO → Smooth Talker
  - R2-D2 → Techno Wizard
  - BB-8 → Techno Wizard
  - Imperial Stormtrooper → Persistent Pest
  - First Order Stormtrooper → Persistent Pest
  - B1 Battle Droid → Persistent Pest
  - Krayt dragon → Nasty Beast
  - Rancor → Nasty Beast
- **Don't classify by what they could do** — classify by what they're *known for*. A Hutt crime lord is Power Broker even though they have armed guards; an assassin droid is Shadow Operative or Marksman even though they're heavily armed; a Senator is Schemer or Power Broker even if statted with combat skills.
- For unfamiliar/obscure NPCs, infer from their archetype list, traits, faction, skills, and weapons. Default to Persistent Pest only when no other category clearly fits.

# Output

Return a JSON object with field "classifications": an array of {name, coreArchetype} for every entry in the input batch, in the same order. Output ONLY the JSON object — no commentary, no thinking out loud.`;

const SCHEMA = {
  type: 'object',
  properties: {
    classifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          coreArchetype: { type: 'string', enum: CORE_ARCHETYPES },
        },
        required: ['name', 'coreArchetype'],
        additionalProperties: false,
      },
    },
  },
  required: ['classifications'],
  additionalProperties: false,
};

function compactProfile(adv) {
  // Compact representation — drop verbose ability descriptions, keep names only.
  const abilities = (adv.abilities || []).map((a) => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean);
  const weapons = (adv.weapons || []).map((w) => (typeof w === 'string' ? w : w?.name || '')).filter(Boolean);
  return {
    name: adv.name,
    type: adv.type,
    archetypes: adv.archetypes,
    factions: adv.factions,
    traits: adv.traits,
    skills: adv.skills,
    talents: adv.talents,
    abilities,
    weapons,
  };
}

const client = new Anthropic();

async function classifyBatch(batch) {
  const payload = batch.map(compactProfile);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Classify these adversaries:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock?.text) throw new Error('no text block in response');
  const parsed = JSON.parse(textBlock.text);
  if (!Array.isArray(parsed.classifications)) throw new Error('missing classifications array');

  return { classifications: parsed.classifications, usage: response.usage };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Set ANTHROPIC_API_KEY in your environment.');
    process.exit(1);
  }

  const raw = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  const indexByName = new Map();
  data.forEach((adv, i) => {
    if (adv?.name) indexByName.set(adv.name, i);
  });

  const todo = data.filter((adv) => {
    if (!adv?.name || !adv?.type) return false;
    if (force) return true;
    return !adv.coreArchetype || !VALID.has(adv.coreArchetype);
  });

  console.log(`To classify: ${todo.length} of ${data.length} (force=${force}).`);

  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let appliedCount = 0;
  let failedBatches = 0;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(todo.length / BATCH_SIZE);
    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${batch.length} entries)... `);

    let attempt = 0;
    let result = null;
    while (attempt < 2 && !result) {
      attempt++;
      try {
        result = await classifyBatch(batch);
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          console.warn(`\n  rate-limited, sleeping 30s...`);
          await new Promise((r) => setTimeout(r, 30000));
        } else if (err instanceof Anthropic.APIError) {
          console.warn(`\n  API error ${err.status}: ${err.message}`);
          if (attempt >= 2) {
            failedBatches++;
            break;
          }
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          console.error(`\n  ${err.message ?? err}`);
          failedBatches++;
          break;
        }
      }
    }
    if (!result) {
      console.log('SKIPPED');
      continue;
    }

    const { classifications, usage } = result;
    totalCacheRead += usage.cache_read_input_tokens || 0;
    totalCacheWrite += usage.cache_creation_input_tokens || 0;
    totalInput += usage.input_tokens || 0;
    totalOutput += usage.output_tokens || 0;

    // Apply by name; fall back to skip if name didn't match anything (rare).
    let applied = 0;
    for (const c of classifications) {
      if (!c?.name || !c?.coreArchetype) continue;
      const idx = indexByName.get(c.name);
      if (idx == null) continue;
      if (!VALID.has(c.coreArchetype)) continue;
      data[idx].coreArchetype = c.coreArchetype;
      applied++;
    }
    appliedCount += applied;

    // Save after each batch — resumable.
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

    console.log(
      `applied=${applied}/${batch.length}, cache_read=${usage.cache_read_input_tokens ?? 0}, cache_write=${usage.cache_creation_input_tokens ?? 0}, in=${usage.input_tokens ?? 0}, out=${usage.output_tokens ?? 0}`,
    );
  }

  // Final distribution
  const counts = new Map();
  for (const adv of data) {
    if (adv?.coreArchetype) counts.set(adv.coreArchetype, (counts.get(adv.coreArchetype) || 0) + 1);
  }
  console.log('\nFinal distribution:');
  for (const [k, v] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)} ${k}`);
  }
  console.log(`\nClassified ${appliedCount} entries; ${failedBatches} batches failed.`);
  console.log(
    `Total tokens — cache_read: ${totalCacheRead}, cache_write: ${totalCacheWrite}, input: ${totalInput}, output: ${totalOutput}`,
  );

  // Rough cost estimate (Opus 4.7: $5/M input, $25/M output, cache reads ~$0.50/M, cache writes ~$6.25/M).
  const cost =
    (totalInput * 5) / 1_000_000 +
    (totalCacheRead * 0.5) / 1_000_000 +
    (totalCacheWrite * 6.25) / 1_000_000 +
    (totalOutput * 25) / 1_000_000;
  console.log(`Approximate cost: $${cost.toFixed(2)} (Opus 4.7).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

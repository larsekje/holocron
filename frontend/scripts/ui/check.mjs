#!/usr/bin/env node
// Regression check for the 2026-07-30 playtest notes. Starts its own Vite
// dev server, loads the playtest fixture (mid-encounter: Rodas Olo, the
// Pirates minion group, Sall, Veem, Brunt, Sliprigg) in a fresh headless
// browser per check, drives the UI, and prints PASS / FAIL per check.
//
//   npm run ui:check                 # all checks
//   npm run ui:check -- opposed      # only checks whose id contains "opposed"
//
// Checks tagged `relay` need the sync backend (docker `holocron-rest`, or
// `poetry run python -m holocron.app`); they're skipped when it's down.
// Set SYNC_PORT if it isn't on 8081.
//
// Needs Playwright (not a project dependency):
//   npm i --no-save playwright && npx playwright install chromium
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const PORT = Number(process.env.UI_CHECK_PORT ?? 8123);
const SYNC_PORT = process.env.SYNC_PORT ?? '8081';
const URL = `http://localhost:${PORT}/`;
const filter = process.argv[2];

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright missing: npm i --no-save playwright && npx playwright install chromium');
  process.exit(2);
}

const fixture = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/playtest-2026-07-30.json'), 'utf8'));
const ID = {
  rodas: 'ZQvoNW_RZpx2aeLWnFJLy',
  pirates: 'uGS_JwyRRSVABP_AbEFwk',
  sall: '5DQeSlp5V4Jplur6P_xpL',
};

// ── helpers ────────────────────────────────────────────────────────────────

/** Seed the fixture (optionally mutated) and load the app. */
async function open(page, mutate) {
  const seed = structuredClone(fixture);
  if (mutate) mutate(seed);
  await page.goto(URL);
  await page.evaluate((seed) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
  }, seed);
  await page.reload();
  await page.waitForTimeout(1200);
}

/** Edit a persisted store inside a fixture copy. */
function store(seed, name, fn) {
  const key = `holocron:v1:${name}`;
  const s = JSON.parse(seed[key]);
  fn(s.state);
  seed[key] = JSON.stringify(s);
}
const participant = (state, name) => state.participants.find((p) => p.name === name);
const makeActive = (id) => (seed) => {
  store(seed, 'newGameplay', (g) => {
    g.context.activeParticipantId = id;
    g.context.actedParticipants = [];
    g.context.turnState = 'turn_active';
  });
  store(seed, 'participants', (p) => { p.selectedParticipantId = id; });
};
const read = (page, name) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(`holocron:v1:${k}`)).state, name);
const slots = async (page) => {
  const c = (await read(page, 'newGameplay')).context;
  return c.initiativeOrder.map((s, i) => (i === c.currentTurnIndex ? '*' : '') + s.team).join(' ');
};
/** Dice currently in the roller's pool, e.g. { ability: 2, difficulty: 1 }. */
const pool = (page) =>
  page.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('[role=dialog] [data-die]')) {
      out[el.dataset.die] = (out[el.dataset.die] ?? 0) + 1;
    }
    return out;
  });
const poolSources = (page) =>
  page.evaluate(() => [...document.querySelectorAll('[role=dialog] [data-die]')].map((e) => e.dataset.source ?? ''));
const rowMenu = (page, name) =>
  page.locator('[aria-label="More actions"]').nth(['Rodas Olo', 'Veem Saalo', 'Brunt', 'Sall', 'Pirates', 'Sliprigg'].indexOf(name));
const menuItem = (page, name) => page.getByRole('menuitem', { name }).filter({ visible: true });
const slotButtons = (page) =>
  page.locator('[role=button][aria-haspopup=menu]').filter({ hasText: /^(PC|NPC)/ });

class Fail extends Error {}
function expect(cond, msg) {
  if (!cond) throw new Fail(msg);
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── checks ─────────────────────────────────────────────────────────────────
// note: the playtest note the check covers.

const checks = [
  {
    id: 'next-hotkey', note: 'Show hotkey on next',
    async run(page) {
      await open(page);
      const label = await page.locator('button.chakra-button:has(kbd)').innerText();
      expect(/Space/.test(label), `Next button reads "${label}"`);
    },
  },
  {
    id: 'next-unsticks', note: 'Must be possible to advance without…',
    async run(page) {
      await open(page); // fixture is the stuck state: Pirates (already acted) active in a PC slot
      await page.mouse.click(700, 960);
      await page.keyboard.press('Space');
      await page.waitForTimeout(700);
      let c = (await read(page, 'newGameplay')).context;
      expect(c.currentTurnIndex === 5, `Space didn't end the stuck turn (index ${c.currentTurnIndex})`);
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      c = (await read(page, 'newGameplay')).context;
      expect(c.currentTurnIndex === 0 && c.round === 3, 'Space did not skip the unclaimed slot');
    },
  },
  {
    id: 'space-double-tap', note: 'regression: fast double Space must not skip a slot',
    async run(page) {
      await open(page);
      await page.mouse.click(700, 960);
      await page.keyboard.press('Space');
      await page.waitForTimeout(60);
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      const c = (await read(page, 'newGameplay')).context;
      expect(c.currentTurnIndex === 5, `double tap landed on index ${c.currentTurnIndex}`);
    },
  },
  {
    id: 'graveyard', note: 'What happened to graveyard?',
    async run(page) {
      await open(page, (s) => store(s, 'participants', (p) => { participant(p, 'Brunt').stats.wounds = 17; }));
      const bar = page.getByText(/Graveyard \(1\)/);
      expect(await bar.isVisible(), 'graveyard bar not visible');
      expect(await page.getByText('Brunt', { exact: true }).first().isVisible(), 'dead name not shown');
      const box = await bar.boundingBox();
      expect(box && box.y < 900, `graveyard below the fold (y=${box?.y})`);
    },
  },
  {
    id: 'minion-count', note: 'Modify minion count',
    async run(page) {
      await open(page, makeActive(ID.pirates));
      await page.getByLabel('Add a minion to the group').click();
      await page.waitForTimeout(200);
      const n = participant(await read(page, 'participants'), 'Pirates').stats.minions;
      expect(n === 5, `minions = ${n}`);
    },
  },
  {
    id: 'pouch-button', note: 'Add to dice pouch (need button)',
    async run(page) {
      await open(page, makeActive(ID.pirates));
      await page.getByLabel('Add to dice pouch').click();
      await page.getByLabel('Add Setback die').click();
      await page.waitForTimeout(200);
      const pouch = participant(await read(page, 'participants'), 'Pirates').dicePouch;
      expect(pouch.setback === 1, `setback in pouch = ${pouch.setback}`);
    },
  },
  {
    id: 'pouch-upgrade', note: 'Add Upgrade to pouch',
    async run(page) {
      await open(page, makeActive(ID.pirates));
      await page.mouse.click(700, 960);
      await page.keyboard.press('p');
      await page.keyboard.type('u');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await page.getByText('Blaster carbine').first().click();
      await page.waitForTimeout(600);
      const before = await pool(page);
      await page.getByLabel('Apply upgrade: Ability → Proficiency').click();
      await page.waitForTimeout(200);
      const after = await pool(page);
      expect((after.proficiency ?? 0) === (before.proficiency ?? 0) + 1, `pool ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
    },
  },
  {
    id: 'weapon-characteristic', note: 'review: ranged attacks rolled Brawn instead of Agility',
    async run(page) {
      await open(page, makeActive(ID.pirates));
      await page.getByText('Blaster carbine').first().click();
      await page.waitForTimeout(600);
      // Pirates: Agility 3, Ranged (Heavy) listed → 2 alive minions → rank 1.
      const p = await pool(page);
      expect((p.ability ?? 0) === 2 && (p.proficiency ?? 0) === 1, `pool ${JSON.stringify(p)}, expected 2 green + 1 yellow`);
    },
  },
  {
    id: 'roller-target', note: 'Change target in dice roller',
    async run(page) {
      await open(page, makeActive(ID.pirates));
      await page.getByText('Blaster carbine').first().click();
      await page.waitForTimeout(600);
      expect(await page.getByRole('button', { name: 'Pick a target' }).isVisible(), 'attack did not start untargeted');
      await page.getByRole('button', { name: 'Pick a target' }).click();
      await page.getByRole('menuitem', { name: 'Sall' }).click();
      await page.waitForTimeout(300);
      const p = await pool(page);
      expect((p.challenge ?? 0) === 2, `Sall's Adversary 2 not applied: ${JSON.stringify(p)}`);
      const sel = (await read(page, 'participants')).selectedParticipantId;
      expect(sel === ID.sall, 'selection did not follow the target');
    },
  },
  {
    id: 'target-defense', note: 'review: target defense adds Setback',
    async run(page) {
      await open(page, makeActive(ID.pirates));
      await page.getByText('Blaster carbine').first().click();
      await page.getByRole('button', { name: 'Pick a target' }).click();
      await page.getByRole('menuitem', { name: 'Sall' }).click(); // ranged defense 1
      await page.waitForTimeout(300);
      let src = await poolSources(page);
      expect(src.includes('Ranged defense 1'), `no defense setback: ${src.join(', ')}`);
      await page.getByRole('button', { name: /Sall/ }).click();
      await page.getByRole('menuitem', { name: 'Rodas Olo' }).click(); // defense 0
      await page.waitForTimeout(300);
      src = await poolSources(page);
      expect(!src.some((s) => /defense/.test(s)), `defense not unwound on retarget: ${src.join(', ')}`);
    },
  },
  {
    id: 'crit-roller', note: 'Crit roller avaialbe',
    async run(page) {
      await open(page);
      await page.getByLabel('Critical injury roller').click();
      await page.waitForTimeout(400);
      expect(await page.getByText(/Critical injury/i).first().isVisible(), 'crit roller did not open from the header');
    },
  },
  {
    id: 'disorient', note: 'Disorient status',
    async run(page) {
      await open(page, (s) => {
        makeActive(ID.pirates)(s);
        store(s, 'effects', (e) => {
          const target = { type: 'character', participantId: ID.pirates };
          e.effects = [{ id: 'd', target, remainingDuration: 2, effect: { id: 'd', name: 'Disoriented 2', description: '', target, behavior: { type: 'active', trigger: 'turn-start' }, type: 'status', status: 'disoriented', rank: 2, duration: 2 } }];
        });
      });
      await page.getByText('Blaster carbine').first().click();
      await page.waitForTimeout(600);
      const n = (await poolSources(page)).filter((s) => s === 'Disoriented 2').length;
      expect(n === 2, `${n} Disoriented setbacks`);
    },
  },
  {
    id: 'improvised', note: 'IMprovised weapons',
    async run(page) {
      await open(page, makeActive(ID.rodas));
      expect(await page.getByText('Improvised weapon').first().isVisible(), 'no Improvised weapon on the sheet');
      expect(await page.getByText('Unarmed').first().isVisible(), 'no Unarmed on the sheet');
      await page.getByText('Improvised weapon').first().click();
      await page.waitForTimeout(500);
      const header = await page.locator('[role=dialog] header').innerText();
      expect(/combat/i.test(header) && /Rodas/.test(header), `did not open an attack (header: ${header})`);
    },
  },
  {
    id: 'reference', note: 'List of skills…; range bands per maneuver; what maneuvers do',
    async run(page) {
      await open(page);
      await page.getByLabel('Rules reference').click();
      await page.getByRole('tab', { name: 'Skills' }).click();
      expect(await page.getByRole('dialog').getByText('Skulduggery', { exact: true }).first().isVisible(), 'Skills tab empty');
      await page.getByRole('tab', { name: 'Maneuvers & range' }).click();
      expect(await page.getByRole('dialog').getByText(/Medium ↔ Long/).first().isVisible(), 'range table missing');
    },
  },
  {
    id: 'opposed', note: 'Opposed checks',
    async run(page) {
      await open(page, makeActive(ID.sall));
      await page.getByText(/^Coercion/).first().click();
      await page.waitForTimeout(500);
      await page.getByLabel('Opposed by').selectOption({ label: 'Veem Saalo' });
      await page.getByLabel('Opposing skill').selectOption('Cool'); // Presence 2, Cool 3
      await page.waitForTimeout(200);
      const p = await pool(page);
      expect((p.difficulty ?? 0) === 1 && (p.challenge ?? 0) === 2, `pool ${JSON.stringify(p)}`);
      await page.getByLabel('Opposed by').selectOption({ value: '' });
      await page.waitForTimeout(200);
      expect((await page.getByLabel('Opposed by').inputValue()) === '', 'picker kept the old opposer');
      expect(await page.getByLabel('Opposing skill').isDisabled(), 'skill picker still enabled');
    },
  },
  {
    id: 'opposed-keeps-upgrade', note: 'review: opposing must not eat a banked ↑D',
    async run(page) {
      await open(page, (s) => {
        makeActive(ID.sall)(s);
        store(s, 'participants', (p) => { participant(p, 'Sall').dicePouch.upgradeDifficulty = 1; });
      });
      await page.getByText(/^Coercion/).first().click();
      await page.getByLabel('Apply upgrade: Difficulty → Challenge').click();
      await page.getByLabel('Opposed by').selectOption({ label: 'Veem Saalo' });
      await page.getByLabel('Opposing skill').selectOption('Cool');
      await page.waitForTimeout(200);
      const p = await pool(page);
      expect((p.challenge ?? 0) === 3 && !p.difficulty, `pool ${JSON.stringify(p)}, expected 3 red`);
    },
  },
  {
    id: 'opposed-offstage', note: 'review: off-stage people are not offered as opposition',
    async run(page) {
      await open(page, (s) => {
        makeActive(ID.sall)(s);
        store(s, 'participants', (p) => { participant(p, 'Sliprigg').offstage = true; });
      });
      await page.getByText(/^Coercion/).first().click();
      const options = await page.getByLabel('Opposed by').locator('option').allInnerTexts();
      expect(!options.includes('Sliprigg') && options.includes('Veem Saalo'), `options: ${options.join(', ')}`);
    },
  },
  {
    id: 'companion', note: 'Companion NPC',
    async run(page) {
      await open(page);
      const before = await slots(page);
      await rowMenu(page, 'Brunt').click();
      await page.getByRole('menuitem', { name: /Make companion/ }).click();
      await page.waitForTimeout(300);
      expect(await page.getByText(/Companions \(1\)/).isVisible(), 'no Companions section');
      const after = await slots(page);
      const count = (s, t) => s.split(' ').filter((x) => x.replace('*', '') === t).length;
      expect(count(after, 'PC') === count(before, 'PC') + 1 && count(after, 'NPC') === count(before, 'NPC') - 1,
        `slots ${before} → ${after}`);
    },
  },
  {
    id: 'slots', note: 'Manipulate npc slots (remove when ded)',
    async run(page) {
      await open(page);
      await slotButtons(page).nth(0).click();
      await menuItem(page, 'Add NPC slot after').click();
      expect((await slots(page)).split(' ').length === 7, 'slot not added');
      await slotButtons(page).nth(1).click();
      await menuItem(page, 'Remove this slot').click();
      await menuItem(page, 'Click again to remove').click();
      expect((await slots(page)).split(' ').length === 6, 'slot not removed');
      await rowMenu(page, 'Sall').click();
      await page.getByRole('menuitem', { name: 'Remove from encounter' }).click();
      await page.waitForTimeout(200);
      expect((await slots(page)) === 'NPC NPC NPC NPC *PC', `after removing Sall: ${await slots(page)}`);
    },
  },
  {
    id: 'offstage', note: 'Track npcs that is not in current encounter',
    async run(page) {
      await open(page);
      await rowMenu(page, 'Sliprigg').click();
      await page.getByRole('menuitem', { name: /Send off-stage/ }).click();
      await page.waitForTimeout(200);
      expect((await slots(page)) === 'NPC NPC NPC NPC *PC', `slot not dropped: ${await slots(page)}`);
      await page.getByText(/Off-stage \(1\)/).click();
      await page.locator('[aria-label="More actions"]').last().click();
      await page.getByRole('menuitem', { name: 'Bring into the fight' }).click();
      await page.waitForTimeout(200);
      const s = participant(await read(page, 'participants'), 'Sliprigg');
      expect(!s.offstage && s.stats.wounds === 2, 'came back without his state');
      expect((await slots(page)).split(' ').length === 6, 'slot not returned');
    },
  },
  {
    id: 'offstage-delete', note: 'review: deleting an off-stage participant drops only one slot',
    async run(page) {
      await open(page);
      await rowMenu(page, 'Sliprigg').click();
      await page.getByRole('menuitem', { name: /Send off-stage/ }).click();
      await page.getByText(/Off-stage \(1\)/).click();
      await page.locator('[aria-label="More actions"]').last().click();
      await page.getByRole('menuitem', { name: 'Remove from encounter' }).click();
      await page.waitForTimeout(200);
      expect((await slots(page)) === 'NPC NPC NPC NPC *PC', `slots: ${await slots(page)}`);
    },
  },
  // ── shared screen (needs the relay) ──
  {
    id: 'relay-destiny', note: 'Destiny token does not work on remote', relay: true,
    async run(page, browser) {
      await open(page, (s) => {
        s['holocron:shareRoomId'] = 'ui-check-room';
        s['holocron:isSharing'] = '1';
        s['holocron:v1:destinyPool'] = JSON.stringify({ state: { destinyPool: [true, false] }, version: 1 });
      });
      await page.waitForTimeout(1500);
      const pl = await browser.newPage();
      await pl.goto(`${URL}?pcview=ui-check-room`);
      await pl.waitForTimeout(2000);
      await pl.locator('button[aria-label^="Flip"]').first().click();
      await pl.waitForTimeout(1200);
      const d = (await read(page, 'destinyPool')).destinyPool;
      expect(eq(d, [false, false]), `GM pool ${JSON.stringify(d)}`);
    },
  },
  {
    id: 'relay-pick', note: 'Select active slot on shared screen', relay: true,
    async run(page, browser) {
      await open(page, (s) => {
        s['holocron:shareRoomId'] = 'ui-check-room';
        s['holocron:isSharing'] = '1';
        store(s, 'participants', (p) => { participant(p, 'Brunt').side = 'PC'; });
        store(s, 'newGameplay', (g) => {
          g.context.activeParticipantId = null;
          g.context.actedParticipants = [];
          g.context.turnState = 'turn_start';
        });
      });
      await page.waitForTimeout(1500);
      const pl = await browser.newPage();
      await pl.goto(`${URL}?pcview=ui-check-room`);
      await pl.waitForTimeout(2000);
      await pl.locator('button[aria-label="Brunt acts now"]').click();
      await pl.waitForTimeout(1200);
      const a = (await read(page, 'newGameplay')).context.activeParticipantId;
      const name = participant(await read(page, 'participants'), 'Brunt').id;
      expect(a === name, 'tapping Brunt on the shared screen did not make him active');
    },
  },
  {
    id: 'relay-companion-no-autoclaim', note: 'review: a lone companion is not auto-picked for a PC slot', relay: true,
    async run(page, browser) {
      await open(page, (s) => {
        s['holocron:shareRoomId'] = 'ui-check-room';
        s['holocron:isSharing'] = '1';
        store(s, 'participants', (p) => { participant(p, 'Brunt').side = 'PC'; });
        store(s, 'newGameplay', (g) => {
          g.context.activeParticipantId = null;
          g.context.actedParticipants = [ID.rodas]; // only the companion is left on the PC side
          g.context.turnState = 'turn_start';
        });
      });
      await page.waitForTimeout(1500);
      const pl = await browser.newPage();
      await pl.goto(`${URL}?pcview=ui-check-room`);
      await pl.waitForTimeout(2500);
      const a = (await read(page, 'newGameplay')).context.activeParticipantId;
      expect(a === null, 'the shared screen claimed the slot for the companion');
      expect(await pl.locator('button[aria-label="Brunt acts now"]').isVisible(), 'companion not offered to tap');
    },
  },
  {
    id: 'relay-end-turn', note: 'review: double-tap End turn on the shared screen', relay: true,
    async run(page, browser) {
      await open(page, (s) => {
        s['holocron:shareRoomId'] = 'ui-check-room';
        s['holocron:isSharing'] = '1';
        makeActive(ID.rodas)(s);
      });
      await page.waitForTimeout(1500);
      const pl = await browser.newPage();
      await pl.goto(`${URL}?pcview=ui-check-room`);
      await pl.waitForTimeout(2000);
      const btn = pl.getByRole('button', { name: 'End turn' });
      await btn.click();
      await btn.click({ force: true, timeout: 500 }).catch(() => {});
      await pl.waitForTimeout(1500);
      const c = (await read(page, 'newGameplay')).context;
      expect(c.currentTurnIndex === 5, `landed on index ${c.currentTurnIndex}`);
    },
  },
];

// ── runner ─────────────────────────────────────────────────────────────────

async function relayUp() {
  try {
    const r = await fetch(`http://localhost:${SYNC_PORT}/sync/ui-check-probe/action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    return r.ok;
  } catch {
    return false;
  }
}

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  env: { ...process.env, VITE_SYNC_PORT: SYNC_PORT },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('Vite did not start')), 30000);
  vite.stdout.on('data', (d) => { if (/ready in/.test(String(d))) { clearTimeout(t); resolve(); } });
  vite.on('exit', (code) => reject(new Error(`Vite exited (${code})`)));
});

const relay = await relayUp();
const browser = await chromium.launch();
const results = [];
for (const c of checks) {
  if (filter && !c.id.includes(filter)) continue;
  if (c.relay && !relay) {
    results.push({ c, status: 'SKIP', msg: `relay not reachable on :${SYNC_PORT}` });
    continue;
  }
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await c.run(page, ctx);
    if (errors.length) throw new Fail(`page error: ${errors[0]}`);
    results.push({ c, status: 'PASS' });
  } catch (e) {
    results.push({ c, status: 'FAIL', msg: e instanceof Fail ? e.message : String(e.message ?? e).split('\n')[0] });
    fs.mkdirSync(path.join(here, 'out'), { recursive: true });
    await page.screenshot({ path: path.join(here, 'out', `FAIL-${c.id}.png`) }).catch(() => {});
  }
  await ctx.close();
}
await browser.close();
vite.kill();

const pad = Math.max(...results.map((r) => r.c.id.length));
for (const r of results) {
  const mark = r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '–' : '✗';
  console.log(`${mark} ${r.status} ${r.c.id.padEnd(pad)}  ${r.c.note}${r.msg ? `\n         ${r.msg}` : ''}`);
}
const failed = results.filter((r) => r.status === 'FAIL').length;
console.log(`\n${results.length - failed} of ${results.length} ok${failed ? ` — ${failed} failed (screenshots in scripts/ui/out/)` : ''}`);
process.exit(failed ? 1 : 0);

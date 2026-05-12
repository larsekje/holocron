import { create } from 'zustand';
import {
  ALL_BIASES,
  ATMOSPHERE_COUNT,
  computeToneTarget,
  getBank,
  getEnvCount,
  getNpcMixForHeat,
  getNpcModeMixForHeat,
  isTimeInvariant,
  JuiceArchetype,
  JuiceBias,
  JuiceEntry,
  JuiceNpcMode,
  JuiceNpcType,
  JuiceSlot,
  JuiceTone,
  NpcModeMix,
} from '@/data/narrativeJuice';

export type SceneCardKind =
  | 'atmosphere'
  | 'anchor'
  | 'featured'
  | 'background'
  | 'environmental'
  | 'complication';

export interface SceneCard {
  kind: SceneCardKind;
  // Always exactly one entry per card under v2 (atmosphere is a single
  // pre-composed entry, not a chain of atoms). Stored as an array for
  // uniformity with the previous shape and to keep the renderer simple.
  entries: JuiceEntry[];
  severity?: 'mild' | 'acute';
}

export interface Scene {
  cards: SceneCard[];
}

const RECENCY_WINDOW = 5;
const TONE_AXIS_KEYS: (keyof JuiceTone)[] = ['pulpy', 'seedy', 'intrigue', 'refined'];

interface NarrativeJuiceState {
  isOpen: boolean;
  archetype: JuiceArchetype;
  skin: string | null;
  heat: 1 | 2 | 3;
  bias: JuiceBias[];
  scene: Scene;
  recentTextsBySlot: Record<JuiceSlot, string[]>;

  open: () => void;
  close: () => void;
  setArchetype: (a: JuiceArchetype) => void;
  setSkin: (s: string | null) => void;
  setHeat: (h: 1 | 2 | 3) => void;
  toggleBias: (b: JuiceBias) => void;
  rollScene: () => void;
  rerollCard: (cardIndex: number) => void;
}

function emptyRecency(): Record<JuiceSlot, string[]> {
  return { atmosphere: [], npc: [], environmental: [], complication: [] };
}

function pushRecent(list: string[], text: string): string[] {
  return [text, ...list.filter((t) => t !== text)].slice(0, RECENCY_WINDOW);
}

export function toneDistance(a: JuiceTone, b: JuiceTone): number {
  return (
    Math.abs(a.pulpy - b.pulpy) +
    Math.abs(a.seedy - b.seedy) +
    Math.abs(a.intrigue - b.intrigue) +
    Math.abs(a.refined - b.refined)
  );
}

export interface AxisAvailability {
  perValue: Record<number, number>;
  max: number;
}

export function getToneAvailability(
  archetype: JuiceArchetype,
  skin: string | null,
  heat: 1 | 2 | 3,
): Record<keyof JuiceTone, AxisAvailability> {
  const bank = getBank(archetype);
  const pool = bank.filter(
    (e) =>
      e.archetype === archetype &&
      (!skin || e.skin === skin) &&
      (isTimeInvariant(e) || e.heat === heat),
  );
  const axes: (keyof JuiceTone)[] = ['pulpy', 'seedy', 'intrigue', 'refined'];
  const out = {} as Record<keyof JuiceTone, AxisAvailability>;
  for (const a of axes) {
    const perValue: Record<number, number> = { [-1]: 0, 0: 0, 1: 0, 2: 0 };
    for (const e of pool) {
      const v = e.tone[a];
      if (perValue[v] !== undefined) perValue[v]++;
    }
    out[a] = { perValue, max: Math.max(0, ...Object.values(perValue)) };
  }
  return out;
}

export function getHeatAvailability(
  archetype: JuiceArchetype,
  skin: string | null,
): AxisAvailability {
  const bank = getBank(archetype);
  const pool = bank.filter(
    (e) => e.archetype === archetype && (!skin || e.skin === skin),
  );
  const perValue: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const e of pool) {
    if (perValue[e.heat] !== undefined) perValue[e.heat]++;
  }
  return { perValue, max: Math.max(0, ...Object.values(perValue)) };
}

export interface SlotMatchStats {
  slot: JuiceSlot;
  needed: number;
  matches: number;
  perfectTone: number;
  biasOverlap: number;
}

export function getMatchStats(
  archetype: JuiceArchetype,
  skin: string | null,
  tone: JuiceTone,
  heat: 1 | 2 | 3,
  bias: JuiceBias[],
): SlotMatchStats[] {
  const bank = getBank(archetype);
  const mix = getNpcMixForHeat(heat);
  const envCount = getEnvCount(archetype, heat);
  const needed: Record<JuiceSlot, number> = {
    atmosphere: ATMOSPHERE_COUNT,
    npc: mix.anchor + mix.featured + mix.background,
    environmental: envCount,
    complication: 1,
  };
  const slotOrder: JuiceSlot[] = ['atmosphere', 'npc', 'environmental', 'complication'];
  return slotOrder
    .filter((slot) => needed[slot] > 0)
    .map((slot) => {
      const matches = bank.filter(
        (e) =>
          e.slot === slot &&
          e.archetype === archetype &&
          (!skin || e.skin === skin) &&
          (isTimeInvariant(e) || e.heat === heat),
      );
      const perfectTone = matches.filter(
        (e) => toneDistance(e.tone, tone) === 0,
      ).length;
      const biasOverlap =
        bias.length === 0
          ? 0
          : matches.filter((e) =>
              e.bias.some((b) => (bias as string[]).includes(b)),
            ).length;
      return {
        slot,
        needed: needed[slot],
        matches: matches.length,
        perfectTone,
        biasOverlap,
      };
    });
}

function squaredToneDistance(a: JuiceTone, b: JuiceTone): number {
  let s = 0;
  for (const k of TONE_AXIS_KEYS) {
    const d = a[k] - b[k];
    s += d * d;
  }
  return s;
}

interface WeightOptions {
  extremeCut: boolean;
  extremeSpread: number;
  applyBias: boolean;
  requireBias?: JuiceBias;
}

const TIERS: WeightOptions[] = [
  { extremeCut: true, extremeSpread: 1, applyBias: true },
  { extremeCut: true, extremeSpread: 2, applyBias: true },
  { extremeCut: false, extremeSpread: 0, applyBias: false },
];

function computeAtomWeight(
  atom: JuiceEntry,
  settings: JuiceTone,
  biasActive: JuiceBias[],
  recentTexts: Set<string>,
  opts: WeightOptions,
): number {
  if (opts.requireBias && !atom.bias.includes(opts.requireBias)) return 0;
  if (opts.extremeCut) {
    for (const axis of TONE_AXIS_KEYS) {
      if (
        Math.abs(settings[axis]) === 2 &&
        Math.abs(atom.tone[axis] - settings[axis]) > opts.extremeSpread
      ) {
        return 0;
      }
    }
  }

  const dist = squaredToneDistance(atom.tone, settings);
  let base = 1.0 / (1.0 + dist);

  if (atom.npc_type === 'background') {
    base = Math.max(base, 0.4);
  }

  let biasMul = 1.0;
  if (opts.applyBias && biasActive.length > 0) {
    for (const b of biasActive) {
      if (atom.bias.includes(b)) biasMul *= 1.5;
    }
  }

  let weight = base * biasMul;
  if (recentTexts.has(atom.text)) weight *= 0.3;
  return weight;
}

function weightedPick<T extends { entry: JuiceEntry; weight: number }>(
  items: T[],
): T | undefined {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return undefined;
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function pickOne(
  pool: JuiceEntry[],
  settings: JuiceTone,
  biasActive: JuiceBias[],
  recentTexts: Set<string>,
  requireBias?: JuiceBias,
): JuiceEntry | undefined {
  if (pool.length === 0) return undefined;
  for (const tier of TIERS) {
    const opts: WeightOptions = { ...tier, requireBias };
    const scored = pool
      .map((entry) => ({
        entry,
        weight: computeAtomWeight(entry, settings, biasActive, recentTexts, opts),
      }))
      .filter((w) => w.weight > 0);
    if (scored.length > 0) {
      const picked = weightedPick(scored);
      if (picked) return picked.entry;
    }
  }
  if (requireBias) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface SelectContext {
  archetype: JuiceArchetype;
  skin: string | null;
  heat: 1 | 2 | 3;
  bias: JuiceBias[];
  tone: JuiceTone;
}

interface SelectConstraints {
  npc_type?: JuiceNpcType;
  npc_mode?: JuiceNpcMode;
}

function matchesConstraints(entry: JuiceEntry, c: SelectConstraints): boolean {
  if (c.npc_type && entry.npc_type !== c.npc_type) return false;
  if (c.npc_mode && entry.npc_mode !== c.npc_mode) return false;
  return true;
}

function selectAtom(
  bank: JuiceEntry[],
  slot: JuiceSlot,
  constraints: SelectConstraints,
  ctx: SelectContext,
  excludeTexts: Set<string>,
  slotRecents: Set<string>,
  requireBias?: JuiceBias,
): JuiceEntry | undefined {
  // Heat filter is mode-aware: time-invariant entries (atmosphere, description
  // NPCs) surface at any heat; everything else needs a strict match.
  const hardFilter = (e: JuiceEntry, relaxHeat: boolean) =>
    e.slot === slot &&
    e.archetype === ctx.archetype &&
    (!ctx.skin || e.skin === ctx.skin) &&
    (isTimeInvariant(e) || relaxHeat || e.heat === ctx.heat) &&
    matchesConstraints(e, constraints) &&
    !excludeTexts.has(e.text);

  let pool = bank.filter((e) => hardFilter(e, false));
  let pick = pickOne(pool, ctx.tone, ctx.bias, slotRecents, requireBias);

  // Brief's fallback path: when nothing matches under the strict heat filter,
  // relax it for moment-bound slots too.
  if (!pick) {
    pool = bank.filter((e) => hardFilter(e, true));
    pick = pickOne(pool, ctx.tone, ctx.bias, slotRecents, requireBias);
  }

  return pick;
}

function buildAtmosphere(
  bank: JuiceEntry[],
  ctx: SelectContext,
  exclude: Set<string>,
  slotRecents: Record<JuiceSlot, Set<string>>,
): JuiceEntry[] {
  const picks: JuiceEntry[] = [];
  for (let i = 0; i < ATMOSPHERE_COUNT; i++) {
    const pick = selectAtom(bank, 'atmosphere', {}, ctx, exclude, slotRecents.atmosphere);
    if (pick) {
      picks.push(pick);
      exclude.add(pick.text);
    }
  }
  return picks;
}

function pickNpcWithModeBudget(
  bank: JuiceEntry[],
  npcType: JuiceNpcType,
  modeBudget: NpcModeMix,
  ctx: SelectContext,
  exclude: Set<string>,
  npcRecents: Set<string>,
): JuiceEntry | undefined {
  // Prefer whichever mode still has budget. If both are at 0, pick freely; if
  // one is exhausted, try the other. Either way, fall back to "any mode" if
  // the constrained pick fails — better to surface an off-mode NPC than none.
  const wantAction = modeBudget.action > 0 && modeBudget.action >= modeBudget.description;
  const preferred: JuiceNpcMode = wantAction ? 'action' : 'description';
  const fallback: JuiceNpcMode = preferred === 'action' ? 'description' : 'action';

  const tryMode = (mode: JuiceNpcMode) =>
    selectAtom(bank, 'npc', { npc_type: npcType, npc_mode: mode }, ctx, exclude, npcRecents);

  let pick = modeBudget[preferred] > 0 ? tryMode(preferred) : undefined;
  if (!pick && modeBudget[fallback] > 0) pick = tryMode(fallback);
  if (!pick) pick = selectAtom(bank, 'npc', { npc_type: npcType }, ctx, exclude, npcRecents);

  if (pick && pick.npc_mode) {
    modeBudget[pick.npc_mode] = Math.max(0, modeBudget[pick.npc_mode] - 1);
  }
  return pick;
}

function buildNpcCards(
  bank: JuiceEntry[],
  ctx: SelectContext,
  exclude: Set<string>,
  slotRecents: Record<JuiceSlot, Set<string>>,
): SceneCard[] {
  const mix = getNpcMixForHeat(ctx.heat);
  const modeBudget = getNpcModeMixForHeat(ctx.heat);
  const cards: SceneCard[] = [];

  if (mix.anchor > 0) {
    const anchor = selectAtom(
      bank,
      'npc',
      { npc_type: 'dual_extreme' },
      ctx,
      exclude,
      slotRecents.npc,
    );
    if (anchor) {
      cards.push({ kind: 'anchor', entries: [anchor] });
      exclude.add(anchor.text);
      // Anchors are almost always action-mode and count against that budget.
      if (anchor.npc_mode === 'description') {
        modeBudget.description = Math.max(0, modeBudget.description - 1);
      } else {
        modeBudget.action = Math.max(0, modeBudget.action - 1);
      }
    } else {
      // No anchor in the bank — fall back to an extra featured.
      mix.featured += 1;
    }
  }

  for (let i = 0; i < mix.featured; i++) {
    const pick = pickNpcWithModeBudget(bank, 'featured', modeBudget, ctx, exclude, slotRecents.npc);
    if (pick) {
      cards.push({ kind: 'featured', entries: [pick] });
      exclude.add(pick.text);
    }
  }

  for (let i = 0; i < mix.background; i++) {
    const pick = pickNpcWithModeBudget(bank, 'background', modeBudget, ctx, exclude, slotRecents.npc);
    if (pick) {
      cards.push({ kind: 'background', entries: [pick] });
      exclude.add(pick.text);
    }
  }

  return cards;
}

function buildEnvironmentalCards(
  bank: JuiceEntry[],
  ctx: SelectContext,
  exclude: Set<string>,
  slotRecents: Record<JuiceSlot, Set<string>>,
): SceneCard[] {
  const count = getEnvCount(ctx.archetype, ctx.heat);
  const cards: SceneCard[] = [];
  for (let i = 0; i < count; i++) {
    const pick = selectAtom(bank, 'environmental', {}, ctx, exclude, slotRecents.environmental);
    if (pick) {
      cards.push({ kind: 'environmental', entries: [pick] });
      exclude.add(pick.text);
    }
  }
  return cards;
}

function buildComplicationCard(
  bank: JuiceEntry[],
  ctx: SelectContext,
  exclude: Set<string>,
  slotRecents: Record<JuiceSlot, Set<string>>,
): SceneCard | null {
  const pick = selectAtom(bank, 'complication', {}, ctx, exclude, slotRecents.complication);
  if (!pick) return null;
  exclude.add(pick.text);
  return {
    kind: 'complication',
    entries: [pick],
    severity: ctx.heat === 3 ? 'acute' : 'mild',
  };
}

function enforceBiases(
  scene: Scene,
  ctx: SelectContext,
  bank: JuiceEntry[],
  exclude: Set<string>,
  slotRecents: Record<JuiceSlot, Set<string>>,
): void {
  for (const bias of ctx.bias) {
    const carried = scene.cards.some((c) =>
      c.entries.some((e) => e.bias.includes(bias)),
    );
    if (carried) continue;

    const swapIdx = scene.cards.findIndex((c) => c.kind === 'background');
    const fallbackIdx =
      swapIdx >= 0
        ? swapIdx
        : scene.cards.findIndex((c) => c.kind === 'featured' || c.kind === 'anchor');
    if (fallbackIdx < 0) continue;

    const target = scene.cards[fallbackIdx];
    const oldEntry = target.entries[0];
    const constraint: SelectConstraints = {
      npc_type:
        target.kind === 'anchor'
          ? 'dual_extreme'
          : target.kind === 'featured'
            ? 'featured'
            : 'background',
      npc_mode: oldEntry?.npc_mode,
    };
    const localExclude = new Set(exclude);
    if (oldEntry) localExclude.delete(oldEntry.text);
    const replacement = selectAtom(
      bank,
      'npc',
      constraint,
      ctx,
      localExclude,
      slotRecents.npc,
      bias,
    );
    if (replacement) {
      if (oldEntry) exclude.delete(oldEntry.text);
      exclude.add(replacement.text);
      target.entries = [replacement];
    }
  }
}

function rollFullScene(
  archetype: JuiceArchetype,
  skin: string | null,
  tone: JuiceTone,
  heat: 1 | 2 | 3,
  bias: JuiceBias[],
  recentTextsBySlot: Record<JuiceSlot, string[]>,
): { scene: Scene; recentTextsBySlot: Record<JuiceSlot, string[]> } {
  const bank = getBank(archetype);
  const ctx: SelectContext = { archetype, skin, heat, bias, tone };
  const exclude = new Set<string>();
  const slotRecentSets: Record<JuiceSlot, Set<string>> = {
    atmosphere: new Set(recentTextsBySlot.atmosphere),
    npc: new Set(recentTextsBySlot.npc),
    environmental: new Set(recentTextsBySlot.environmental),
    complication: new Set(recentTextsBySlot.complication),
  };

  const atmosphereEntries = buildAtmosphere(bank, ctx, exclude, slotRecentSets);
  const npcCards = buildNpcCards(bank, ctx, exclude, slotRecentSets);
  const envCards = buildEnvironmentalCards(bank, ctx, exclude, slotRecentSets);
  const complication = buildComplicationCard(bank, ctx, exclude, slotRecentSets);

  const scene: Scene = {
    cards: [
      ...(atmosphereEntries.length > 0
        ? [{ kind: 'atmosphere' as const, entries: atmosphereEntries }]
        : []),
      ...npcCards,
      ...envCards,
      ...(complication ? [complication] : []),
    ],
  };

  enforceBiases(scene, ctx, bank, exclude, slotRecentSets);

  const nextRecents: Record<JuiceSlot, string[]> = {
    atmosphere: [...recentTextsBySlot.atmosphere],
    npc: [...recentTextsBySlot.npc],
    environmental: [...recentTextsBySlot.environmental],
    complication: [...recentTextsBySlot.complication],
  };
  for (const card of scene.cards) {
    for (const entry of card.entries) {
      nextRecents[entry.slot] = pushRecent(nextRecents[entry.slot], entry.text);
    }
  }

  return { scene, recentTextsBySlot: nextRecents };
}

function emptyScene(): Scene {
  return { cards: [] };
}

function npcConstraintForKind(kind: SceneCardKind, oldMode?: JuiceNpcMode): SelectConstraints {
  if (kind === 'anchor') return { npc_type: 'dual_extreme', npc_mode: oldMode };
  if (kind === 'featured') return { npc_type: 'featured', npc_mode: oldMode };
  if (kind === 'background') return { npc_type: 'background', npc_mode: oldMode };
  return {};
}

function slotForKind(kind: SceneCardKind): JuiceSlot | null {
  if (kind === 'atmosphere') return 'atmosphere';
  if (kind === 'environmental') return 'environmental';
  if (kind === 'complication') return 'complication';
  if (kind === 'anchor' || kind === 'featured' || kind === 'background') return 'npc';
  return null;
}

export const useNarrativeJuiceStore = create<NarrativeJuiceState>((set, get) => ({
  isOpen: false,
  archetype: 'drinking_establishment',
  skin: null,
  heat: 2,
  bias: [],
  scene: emptyScene(),
  recentTextsBySlot: emptyRecency(),

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  setArchetype: (a) => {
    set({ archetype: a, skin: null, scene: emptyScene(), recentTextsBySlot: emptyRecency() });
    get().rollScene();
  },

  setSkin: (s) => {
    set({ skin: s });
    get().rollScene();
  },

  setHeat: (h) => {
    set({ heat: h });
    get().rollScene();
  },

  toggleBias: (b) => {
    set((state) => ({
      bias: state.bias.includes(b) ? state.bias.filter((x) => x !== b) : [...state.bias, b],
    }));
    get().rollScene();
  },

  rollScene: () => {
    const { archetype, skin, heat, bias, recentTextsBySlot } = get();
    const tone = computeToneTarget(archetype, skin, heat, bias);
    const result = rollFullScene(archetype, skin, tone, heat, bias, recentTextsBySlot);
    set({ scene: result.scene, recentTextsBySlot: result.recentTextsBySlot });
  },

  rerollCard: (cardIndex) => {
    const { archetype, skin, heat, bias, scene, recentTextsBySlot } = get();
    const card = scene.cards[cardIndex];
    if (!card) return;
    const tone = computeToneTarget(archetype, skin, heat, bias);
    const ctx: SelectContext = { archetype, skin, heat, bias, tone };
    const bank = getBank(archetype);

    const exclude = new Set<string>();
    scene.cards.forEach((c, i) => {
      if (i === cardIndex) return;
      for (const e of c.entries) exclude.add(e.text);
    });
    const slotRecentSets: Record<JuiceSlot, Set<string>> = {
      atmosphere: new Set(recentTextsBySlot.atmosphere),
      npc: new Set(recentTextsBySlot.npc),
      environmental: new Set(recentTextsBySlot.environmental),
      complication: new Set(recentTextsBySlot.complication),
    };

    const slot = slotForKind(card.kind);
    if (!slot) return;
    const oldMode = card.entries[0]?.npc_mode;
    const pick = selectAtom(
      bank,
      slot,
      npcConstraintForKind(card.kind, oldMode),
      ctx,
      exclude,
      slotRecentSets[slot],
    );
    if (!pick) return;

    const nextCard: SceneCard = {
      kind: card.kind,
      entries: [pick],
      severity: card.kind === 'complication' ? (heat === 3 ? 'acute' : 'mild') : undefined,
    };

    const nextCards = scene.cards.slice();
    nextCards[cardIndex] = nextCard;
    const nextRecents = { ...recentTextsBySlot };
    for (const e of nextCard.entries) {
      nextRecents[e.slot] = pushRecent(nextRecents[e.slot], e.text);
    }
    set({ scene: { cards: nextCards }, recentTextsBySlot: nextRecents });
  },
}));

export { ALL_BIASES };

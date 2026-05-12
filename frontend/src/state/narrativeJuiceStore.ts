import { create } from 'zustand';
import {
  ALL_BIASES,
  computeToneTarget,
  getBank,
  JuiceArchetype,
  JuiceBias,
  JuiceEntry,
  JuiceSlot,
  JuiceTone,
  SLOT_DISTRIBUTION,
} from '@/data/narrativeJuice';

export interface SceneSlot {
  slot: JuiceSlot;
  entry: JuiceEntry | null;
}

const RECENCY_WINDOW = 5;
const TONE_AXIS_KEYS: (keyof JuiceTone)[] = ['pulpy', 'seedy', 'intrigue', 'refined'];

interface NarrativeJuiceState {
  isOpen: boolean;
  archetype: JuiceArchetype;
  skin: string | null;
  heat: 1 | 2 | 3;
  bias: JuiceBias[];
  scene: SceneSlot[];
  recentTextsBySlot: Record<JuiceSlot, string[]>;

  open: () => void;
  close: () => void;
  setArchetype: (a: JuiceArchetype) => void;
  setSkin: (s: string | null) => void;
  setHeat: (h: 1 | 2 | 3) => void;
  toggleBias: (b: JuiceBias) => void;
  rollScene: () => void;
  rerollSlot: (index: number) => void;
}

function emptyRecency(): Record<JuiceSlot, string[]> {
  return { sensory: [], npc: [], environmental: [], complication: [] };
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

export interface SlotMatchStats {
  slot: JuiceSlot;
  needed: number;
  matches: number;
  perfectTone: number;
  biasOverlap: number;
}

export interface AxisAvailability {
  perValue: Record<number, number>;
  max: number;
}

export function getToneAvailability(
  archetype: JuiceArchetype,
  skin: string | null,
  heat: number,
): Record<keyof JuiceTone, AxisAvailability> {
  const bank = getBank(archetype);
  const pool = bank.filter(
    (e) =>
      e.archetype === archetype &&
      (!skin || e.skin === skin) &&
      e.heat.includes(heat),
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
    (e) =>
      e.archetype === archetype &&
      (!skin || e.skin === skin),
  );
  const perValue: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const e of pool) {
    for (const h of e.heat) {
      if (perValue[h] !== undefined) perValue[h]++;
    }
  }
  return { perValue, max: Math.max(0, ...Object.values(perValue)) };
}

export function getMatchStats(
  archetype: JuiceArchetype,
  skin: string | null,
  tone: JuiceTone,
  heat: number,
  bias: JuiceBias[],
): SlotMatchStats[] {
  const bank = getBank(archetype);
  const dist = SLOT_DISTRIBUTION[archetype];
  const slotOrder: JuiceSlot[] = ['sensory', 'npc', 'environmental', 'complication'];
  return slotOrder
    .filter((slot) => (dist[slot] ?? 0) > 0)
    .map((slot) => {
      const matches = bank.filter(
        (e) =>
          e.slot === slot &&
          e.archetype === archetype &&
          (!skin || e.skin === skin) &&
          e.heat.includes(heat),
      );
      const perfectTone = matches.filter((e) => toneDistance(e.tone, tone) === 0).length;
      const biasOverlap =
        bias.length === 0
          ? 0
          : matches.filter((e) => e.bias.some((b) => (bias as string[]).includes(b))).length;
      return {
        slot,
        needed: dist[slot] ?? 0,
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
  extremeSpread: number; // permitted axis-deviation when an axis is at ±2
  applyBias: boolean;
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
  if (opts.extremeCut) {
    for (const axis of TONE_AXIS_KEYS) {
      if (Math.abs(settings[axis]) === 2 && Math.abs(atom.tone[axis] - settings[axis]) > opts.extremeSpread) {
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
    const overlap = atom.bias.filter((b) => (biasActive as string[]).includes(b)).length;
    biasMul = 1.0 + 0.5 * overlap;
  }

  let weight = base * biasMul;
  if (recentTexts.has(atom.text)) {
    weight *= 0.3;
  }
  return weight;
}

function weightedPick<T extends { entry: JuiceEntry; weight: number }>(items: T[]): T | undefined {
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
): JuiceEntry | undefined {
  if (pool.length === 0) return undefined;
  for (const tier of TIERS) {
    const scored = pool
      .map((entry) => ({ entry, weight: computeAtomWeight(entry, settings, biasActive, recentTexts, tier) }))
      .filter((w) => w.weight > 0);
    if (scored.length > 0) {
      const picked = weightedPick(scored);
      if (picked) return picked.entry;
    }
  }
  // Last resort: uniform random within the hard-filtered pool.
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickFromBank(
  bank: JuiceEntry[],
  slot: JuiceSlot,
  count: number,
  archetype: JuiceArchetype,
  skin: string | null,
  tone: JuiceTone,
  heat: number,
  bias: JuiceBias[],
  excludeTexts: Set<string>,
  recentTexts: Set<string>,
): JuiceEntry[] {
  const matchesHeat = (e: JuiceEntry) =>
    e.slot === slot &&
    e.archetype === archetype &&
    (!skin || e.skin === skin) &&
    e.heat.includes(heat);
  const matchesAnyHeat = (e: JuiceEntry) =>
    e.slot === slot &&
    e.archetype === archetype &&
    (!skin || e.skin === skin);

  const seenInScene = new Set(excludeTexts);
  const seenRecent = new Set(recentTexts);
  const picks: JuiceEntry[] = [];

  for (let i = 0; i < count; i++) {
    let pool = bank.filter((e) => matchesHeat(e) && !seenInScene.has(e.text));
    let pick = pickOne(pool, tone, bias, seenRecent);

    // Heat-relax fallback: if nothing matched the requested heat, drop the heat filter.
    if (!pick) {
      pool = bank.filter((e) => matchesAnyHeat(e) && !seenInScene.has(e.text));
      pick = pickOne(pool, tone, bias, seenRecent);
    }

    if (!pick) break;
    picks.push(pick);
    seenInScene.add(pick.text);
    seenRecent.add(pick.text);
  }

  return picks;
}

function buildEmptyScene(archetype: JuiceArchetype): SceneSlot[] {
  const dist = SLOT_DISTRIBUTION[archetype];
  const slots: SceneSlot[] = [];
  (['sensory', 'npc', 'environmental', 'complication'] as JuiceSlot[]).forEach((slot) => {
    const n = dist[slot] ?? 0;
    for (let i = 0; i < n; i++) {
      slots.push({ slot, entry: null });
    }
  });
  return slots;
}

interface RollResult {
  scene: SceneSlot[];
  recentTextsBySlot: Record<JuiceSlot, string[]>;
}

function rollFullScene(
  archetype: JuiceArchetype,
  skin: string | null,
  tone: JuiceTone,
  heat: number,
  bias: JuiceBias[],
  recentTextsBySlot: Record<JuiceSlot, string[]>,
): RollResult {
  const bank = getBank(archetype);
  const scene = buildEmptyScene(archetype);
  const exclude = new Set<string>();
  const nextRecents: Record<JuiceSlot, string[]> = {
    sensory: [...recentTextsBySlot.sensory],
    npc: [...recentTextsBySlot.npc],
    environmental: [...recentTextsBySlot.environmental],
    complication: [...recentTextsBySlot.complication],
  };

  // Group slots by type, pick batch-by-slot to enforce no-duplicate-within-slot.
  const groups = new Map<JuiceSlot, number[]>();
  scene.forEach((s, i) => {
    const arr = groups.get(s.slot) ?? [];
    arr.push(i);
    groups.set(s.slot, arr);
  });

  groups.forEach((indexes, slot) => {
    const slotRecents = new Set(recentTextsBySlot[slot]);
    const picks = pickFromBank(bank, slot, indexes.length, archetype, skin, tone, heat, bias, exclude, slotRecents);
    picks.forEach((entry, i) => {
      scene[indexes[i]].entry = entry;
      exclude.add(entry.text);
      nextRecents[slot] = pushRecent(nextRecents[slot], entry.text);
    });
  });

  return { scene, recentTextsBySlot: nextRecents };
}

export const useNarrativeJuiceStore = create<NarrativeJuiceState>((set, get) => ({
  isOpen: false,
  archetype: 'drinking_establishment',
  skin: null,
  heat: 2,
  bias: [],
  scene: buildEmptyScene('drinking_establishment'),
  recentTextsBySlot: emptyRecency(),

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  setArchetype: (a) => {
    const scene = buildEmptyScene(a);
    set({ archetype: a, skin: null, scene, recentTextsBySlot: emptyRecency() });
  },

  setSkin: (s) => set({ skin: s }),

  setHeat: (h) => set({ heat: h }),

  toggleBias: (b) =>
    set((state) => ({
      bias: state.bias.includes(b) ? state.bias.filter((x) => x !== b) : [...state.bias, b],
    })),

  rollScene: () => {
    const { archetype, skin, heat, bias, recentTextsBySlot } = get();
    const tone = computeToneTarget(archetype, skin, heat, bias);
    const result = rollFullScene(archetype, skin, tone, heat, bias, recentTextsBySlot);
    set({ scene: result.scene, recentTextsBySlot: result.recentTextsBySlot });
  },

  rerollSlot: (index) => {
    const { archetype, skin, heat, bias, scene, recentTextsBySlot } = get();
    const target = scene[index];
    if (!target) return;
    const tone = computeToneTarget(archetype, skin, heat, bias);
    const exclude = new Set(scene.map((s) => s.entry?.text).filter(Boolean) as string[]);
    if (target.entry) exclude.delete(target.entry.text);
    const bank = getBank(archetype);
    const slotRecents = new Set(recentTextsBySlot[target.slot]);
    const [pick] = pickFromBank(bank, target.slot, 1, archetype, skin, tone, heat, bias, exclude, slotRecents);
    if (!pick) return;
    const next = scene.slice();
    next[index] = { slot: target.slot, entry: pick };
    set({
      scene: next,
      recentTextsBySlot: {
        ...recentTextsBySlot,
        [target.slot]: pushRecent(recentTextsBySlot[target.slot], pick.text),
      },
    });
  },
}));

export { ALL_BIASES };

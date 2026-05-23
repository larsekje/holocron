import { create } from 'zustand';
import { rollPool, type DieType, type SymbolTotals } from '@/engine/diceEngine';
import type { ModalSnapshot } from '@components/dice/mockSnapshots';
import type { ModifierEntry } from '@components/dice/modifiers';
import useParticipantStore from '@/state/participantsStore';
import useSessionLogStore from '@/state/sessionLogStore';
import { flipAttackTarget as computeFlippedSnapshot } from '@/utils/diceSnapshots';
import { rollPolyPool, POLY_DICE, type PolyDie, type PolyPool, type PolyRollResult } from '@/engine/polyDice';

export type BonusSymbolKind = keyof SymbolTotals;

interface DiceRollerState {
  snapshot: ModalSnapshot | null;
  /** True while the dice are tumbling — UI uses this to play the roll animation
   * and to hide the symbol overlay until the dice settle. */
  rolling: boolean;
  open: (snapshot: ModalSnapshot) => void;
  update: (patch: Partial<ModalSnapshot>) => void;
  addDie: (die: DieType, source?: string) => void;
  removeDie: (die: DieType) => void;
  setDifficulty: (presetId: string, count: number, sourceLabel?: string) => void;
  toggleModifier: (mod: ModifierEntry) => void;
  addBonusSymbol: (kind: BonusSymbolKind, count?: number) => void;
  removeBonusSymbol: (kind: BonusSymbolKind, count?: number) => void;
  /** Hand the prepared pool off to another participant — they become the
   * attacker of the snapshot and roll the same pool/modifiers/bonuses. */
  passPoolTo: (participantId: string) => void;
  /** Flip the resolved attack target between the vehicle and the character
   * it carries (when both candidates are on the snapshot). Strips the
   * vehicle-target modifier dice for the previous target and re-applies for
   * the new one; preserves manual additions. */
  flipAttackTarget: (newKind: 'vehicle' | 'character') => void;
  roll: () => void;
  /** Polyhedral (numbered-dice) mode — separate from the narrative pool. */
  addPolyDie: (die: PolyDie) => void;
  removePolyDie: (die: PolyDie) => void;
  rollPoly: () => void;
  recordSpend: (optionId: string, label?: string, recipientId?: string) => void;
  undoSpend: (spendIndex: number) => void;
  close: () => void;
}

// Bracket codes ([SU], [FA], [AD], etc.) get rendered as actual SWRPG dice
// glyphs by renderSwrpgText in the session log Sidebar.
function summariseRoll(snap: ModalSnapshot): string {
  const r = snap.result;
  if (!r) return snap.label;
  const bits: string[] = [];
  if (r.net.netSuccess > 0) bits.push(`${r.net.netSuccess}[SU]`);
  else if (r.net.netSuccess < 0) bits.push(`fail (${-r.net.netSuccess}[FA])`);
  else bits.push('tie');
  if (r.net.netAdvantage > 0) bits.push(`${r.net.netAdvantage}[AD]`);
  else if (r.net.netAdvantage < 0) bits.push(`${-r.net.netAdvantage}[TH]`);
  if (r.net.triumph > 0) bits.push(`${r.net.triumph}[TR]`);
  if (r.net.despair > 0) bits.push(`${r.net.despair}[DE]`);
  return `${snap.label}: ${bits.join(' ')}`;
}

function summarisePolyRoll(pool: PolyPool, result: PolyRollResult): string {
  const poolStr = POLY_DICE
    .filter((d) => (pool[d] ?? 0) > 0)
    .map((d) => `${pool[d]}${d}`)
    .join(' + ');
  const values = result.rolls.map((r) => r.value).join(', ');
  return `Dice — ${poolStr} = ${result.total} (${values})`;
}

const ROLL_ANIMATION_MS = 700;

const useDiceRollerStore = create<DiceRollerState>((set, get) => ({
  snapshot: null,
  rolling: false,
  open: (snapshot) => set({ snapshot }),
  update: (patch) =>
    set((state) =>
      state.snapshot ? { snapshot: { ...state.snapshot, ...patch } } : state,
    ),
  addDie: (die, source) =>
    set((state) => {
      if (!state.snapshot) return state;
      const cur = state.snapshot.pool[die] ?? 0;
      const curSources = state.snapshot.poolSources?.[die] ?? [];
      return {
        snapshot: {
          ...state.snapshot,
          pool: { ...state.snapshot.pool, [die]: cur + 1 },
          poolSources: {
            ...state.snapshot.poolSources,
            [die]: [...curSources, source ?? 'Manual'],
          },
          // Editing the pool invalidates the previous roll.
          result: null,
          spent: [],
        },
      };
    }),
  removeDie: (die) =>
    set((state) => {
      if (!state.snapshot) return state;
      const cur = state.snapshot.pool[die] ?? 0;
      if (cur <= 0) return state;
      const next = { ...state.snapshot.pool, [die]: cur - 1 };
      if (next[die] === 0) delete next[die];
      const curSources = state.snapshot.poolSources?.[die] ?? [];
      const nextSourcesArr = curSources.slice(0, -1);
      const nextSources = { ...state.snapshot.poolSources };
      if (nextSourcesArr.length === 0) delete nextSources[die];
      else nextSources[die] = nextSourcesArr;
      return {
        snapshot: {
          ...state.snapshot,
          pool: next,
          poolSources: nextSources,
          result: null,
          spent: [],
        },
      };
    }),
  addBonusSymbol: (kind, count = 1) =>
    set((state) => {
      if (!state.snapshot) return state;
      const cur = state.snapshot.bonusSymbols ?? {};
      return {
        snapshot: {
          ...state.snapshot,
          bonusSymbols: { ...cur, [kind]: (cur[kind] ?? 0) + count },
          result: null,
          spent: [],
        },
      };
    }),
  removeBonusSymbol: (kind, count = 1) =>
    set((state) => {
      if (!state.snapshot) return state;
      const cur = state.snapshot.bonusSymbols ?? {};
      const next = Math.max(0, (cur[kind] ?? 0) - count);
      const nextBonus = { ...cur };
      if (next === 0) delete nextBonus[kind];
      else nextBonus[kind] = next;
      return {
        snapshot: {
          ...state.snapshot,
          bonusSymbols: nextBonus,
          result: null,
          spent: [],
        },
      };
    }),
  toggleModifier: (mod) =>
    set((state) => {
      if (!state.snapshot) return state;
      const isOn = state.snapshot.appliedModifiers.includes(mod.id);
      const sign = isOn ? -1 : 1;
      const nextPool = { ...state.snapshot.pool };
      const nextSources: Partial<Record<DieType, string[]>> = {
        ...(state.snapshot.poolSources ?? {}),
      };
      const sourceLabel = mod.label;
      const apply = (key: 'boost' | 'setback' | 'difficulty' | 'ability', delta: number | undefined) => {
        if (!delta) return;
        const cur = nextPool[key] ?? 0;
        const next = Math.max(0, cur + sign * delta);
        if (next === 0) delete nextPool[key];
        else nextPool[key] = next;
        // Mirror the count change on the sources array. On toggle-on, push
        // |delta| copies of the modifier's label. On toggle-off, drop the
        // first matching label entries (or fall through to dropping from end).
        const curSrc = nextSources[key] ?? [];
        if (sign > 0) {
          nextSources[key] = [...curSrc, ...Array(Math.abs(delta)).fill(sourceLabel)];
        } else {
          let dropped = 0;
          const filtered: string[] = [];
          for (const s of curSrc) {
            if (dropped < Math.abs(delta) && s === sourceLabel) {
              dropped++;
              continue;
            }
            filtered.push(s);
          }
          // If no matching labels (e.g. label drift), drop from the end.
          while (dropped < Math.abs(delta) && filtered.length > 0) {
            filtered.pop();
            dropped++;
          }
          if (filtered.length === 0) delete nextSources[key];
          else nextSources[key] = filtered;
        }
      };
      apply('boost', mod.effect.boost);
      apply('setback', mod.effect.setback);
      apply('difficulty', mod.effect.difficulty);
      apply('ability', mod.effect.ability);
      const nextModifiers = isOn
        ? state.snapshot.appliedModifiers.filter((id) => id !== mod.id)
        : [...state.snapshot.appliedModifiers, mod.id];
      return {
        snapshot: {
          ...state.snapshot,
          pool: nextPool,
          poolSources: nextSources,
          appliedModifiers: nextModifiers,
          // Editing the pool invalidates the previous roll.
          result: null,
          spent: [],
        },
      };
    }),
  setDifficulty: (presetId, count, sourceLabel) =>
    set((state) => {
      if (!state.snapshot) return state;
      const nextPool = { ...state.snapshot.pool, difficulty: count };
      if (count === 0) delete nextPool.difficulty;
      const otherPresets = state.snapshot.appliedPresets.filter(
        (id) => !id.startsWith('difficulty-'),
      );
      // Replace difficulty sources entirely — the new set wholly supersedes
      // whatever preset/range source was there before.
      const label = sourceLabel ?? 'Difficulty';
      const nextSources = { ...(state.snapshot.poolSources ?? {}) };
      if (count === 0) delete nextSources.difficulty;
      else nextSources.difficulty = Array(count).fill(label);
      return {
        snapshot: {
          ...state.snapshot,
          pool: nextPool,
          poolSources: nextSources,
          appliedPresets: [...otherPresets, presetId],
          result: null,
          spent: [],
        },
      };
    }),
  passPoolTo: (recipientId) => {
    // Side effects (deposits, logging) run first; then the pure store update.
    const snap = get().snapshot;
    if (!snap) return;
    const ps = useParticipantStore.getState();
    const recipient = ps.participants.find((p) => p.id === recipientId);
    if (!recipient) return;

    // Every pool die transfers — DicePouch was extended to accept all the
    // skill-side dice plus the narrative dice.
    const pool = snap.pool;
    const allDice: DieType[] = [
      'ability', 'proficiency', 'difficulty', 'challenge', 'boost', 'setback', 'force',
    ];
    const passSource = snap.attacker?.name
      ? `${snap.attacker.name} — passed pool`
      : 'Passed pool';
    let depositedDice = 0;
    for (const k of allDice) {
      const n = pool[k] ?? 0;
      if (n > 0) {
        ps.addDice(recipient.id, k as any, n, passSource);
        depositedDice += n;
      }
    }
    // Bonus symbols (advantage / threat / etc.) all transfer too.
    const bonus = snap.bonusSymbols ?? {};
    const symbolKeys: Array<keyof SymbolTotals> = [
      'advantage', 'threat', 'triumph', 'despair', 'success', 'failure',
    ];
    let depositedSymbols = 0;
    for (const k of symbolKeys) {
      const n = bonus[k] ?? 0;
      if (n > 0) {
        ps.addDice(recipient.id, k as any, n, passSource);
        depositedSymbols += n;
      }
    }

    useSessionLogStore.getState().log({
      kind: 'reminder-resolved',
      participantId: recipient.id,
      participantName: recipient.name,
      summary: snap.attacker?.name
        ? `${snap.attacker.name} passed ${depositedDice + depositedSymbols} tokens to ${recipient.name}`
        : `Passed ${depositedDice + depositedSymbols} tokens to ${recipient.name}`,
      tone: 'info',
      meta: { rollId: snap.id, passedTo: recipient.id, dice: depositedDice, symbols: depositedSymbols },
    });

    // The source pool empties entirely after a pass.
    set({
      snapshot: {
        ...snap,
        pool: {},
        poolSources: undefined,
        bonusSymbols: undefined,
        result: null,
        spent: [],
      },
    });
  },
  flipAttackTarget: (newKind) =>
    set((state) => {
      if (!state.snapshot) return state;
      const next = computeFlippedSnapshot(state.snapshot, newKind);
      if (next === state.snapshot) return state;
      return { snapshot: next };
    }),
  roll: () => {
    const snap = get().snapshot;
    if (!snap) return;
    const result = rollPool(snap.pool, undefined, snap.bonusSymbols ?? {});
    const next = { ...snap, result, spent: [] };
    set({ snapshot: next, rolling: true });

    // Always clear rolling after the animation window. Earlier we gated this
    // on the snapshot id still matching — but any update that swapped the
    // snapshot mid-animation (open/close, pass, etc.) would leave rolling
    // permanently true and the symbols never appeared on the dice.
    setTimeout(() => set({ rolling: false }), ROLL_ANIMATION_MS);

    useSessionLogStore.getState().log({
      kind: 'damage',
      participantId: snap.attackerParticipantId,
      participantName: snap.attacker?.name,
      summary: summariseRoll(next),
      tone: result.net.succeeded ? 'good' : 'bad',
      meta: { rollId: snap.id, mode: snap.mode },
    });
  },
  addPolyDie: (die) =>
    set((state) => {
      if (!state.snapshot) return state;
      const cur = state.snapshot.polyPool?.[die] ?? 0;
      return {
        snapshot: {
          ...state.snapshot,
          polyPool: { ...state.snapshot.polyPool, [die]: cur + 1 },
          polyResult: null,
        },
      };
    }),
  removePolyDie: (die) =>
    set((state) => {
      if (!state.snapshot) return state;
      const cur = state.snapshot.polyPool?.[die] ?? 0;
      if (cur <= 0) return state;
      const next = { ...state.snapshot.polyPool };
      if (cur - 1 === 0) delete next[die];
      else next[die] = cur - 1;
      return { snapshot: { ...state.snapshot, polyPool: next, polyResult: null } };
    }),
  rollPoly: () => {
    const snap = get().snapshot;
    if (!snap || !snap.polyPool) return;
    const result = rollPolyPool(snap.polyPool);
    set({ snapshot: { ...snap, polyResult: result }, rolling: true });
    setTimeout(() => set({ rolling: false }), ROLL_ANIMATION_MS);
    useSessionLogStore.getState().log({
      kind: 'reminder-resolved',
      summary: summarisePolyRoll(snap.polyPool, result),
      tone: 'info',
      meta: { rollId: snap.id, mode: 'polyhedral' },
    });
  },
  recordSpend: (optionId, label, recipientId) => {
    const snap = get().snapshot;
    if (!snap) return;
    set({
      snapshot: { ...snap, spent: [...snap.spent, { optionId, recipientId }] },
    });
    useSessionLogStore.getState().log({
      kind: 'reminder-resolved',
      participantId: snap.attackerParticipantId,
      participantName: snap.attacker?.name,
      summary: snap.attacker?.name
        ? `${snap.attacker.name} spent: ${label ?? optionId}`
        : `Spent: ${label ?? optionId}`,
      tone: 'info',
      meta: { rollId: snap.id, optionId, recipientId },
    });
  },
  undoSpend: (spendIndex) =>
    set((state) => {
      if (!state.snapshot) return state;
      if (spendIndex < 0 || spendIndex >= state.snapshot.spent.length) return state;
      const next = state.snapshot.spent.slice();
      next.splice(spendIndex, 1);
      return { snapshot: { ...state.snapshot, spent: next } };
    }),
  close: () => set({ snapshot: null }),
}));

export default useDiceRollerStore;

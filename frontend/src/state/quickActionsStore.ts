import { create } from 'zustand';
import useParticipantStore, { DicePouch } from '@/state/participantsStore';
import useDiceRollerStore from '@/state/diceRollerStore';
import useGameplayStore from '@/state/newGameplayStore';
import useSessionLogStore from '@/state/sessionLogStore';
import useActiveVehicleStore from '@/state/activeVehicleStore';
import { applyDamageWithSoak } from '@/utils/applyDamage';
import { buildDefaultAttackSnapshot } from '@/utils/defaultRolls';
import { resolveWeapon, resolveSkillForWeapon } from '@components/statblock/WeaponListOld';
import { buildAttackSnapshot, type WeaponLike } from '@/utils/diceSnapshots';
import type { CharacteristicSet } from '@components/statblock/CharacteristicsOld';

export type QuickActionMode = 'idle' | 'damage' | 'strain' | 'pouch' | 'weapon';

export interface QuickActionResult {
  ok: boolean;
  message: string;
}

interface QuickActionsState {
  mode: QuickActionMode;
  critModalOpen: boolean;
  effectsModalOpen: boolean;
  fullSheetOpen: boolean;
  // The last submitted action's result, displayed briefly as a toast/inline
  // confirmation. Cleared when the GM starts a new action.
  lastResult: QuickActionResult | null;

  enterDamage: () => void;
  enterStrain: () => void;
  enterPouch: () => void;
  enterWeapon: () => void;
  pickWeapon: (index: number) => void;
  openCrit: () => void;
  closeCrit: () => void;
  openEffects: () => void;
  closeEffects: () => void;
  openFullSheet: () => void;
  closeFullSheet: () => void;
  cancel: () => void;
  submit: (input: string) => QuickActionResult;
  noteResult: (result: QuickActionResult) => void;
}

// Single-token pouch parsing. Accepts "3a", "1 triumph", "2 success", etc.
// First capture is the count, second is the kind shorthand or full word.
const POUCH_INPUT_RE = /^\s*(\d+)\s*([a-zA-Z]+)\s*$/;

// Bracket codes used by `renderSwrpgText` to render SWRPG glyphs in log
// summaries. Map each pouch kind to its code so the sidebar shows icons
// instead of bare text.
const POUCH_BRACKET_CODE: Partial<Record<keyof DicePouch, string>> = {
  boost: 'BO',
  setback: 'SE',
  advantage: 'AD',
  threat: 'TH',
  success: 'SU',
  failure: 'FA',
  triumph: 'TR',
  despair: 'DE',
  force: 'FO',
};

// "[BO][BO][BO]" for 3 boost — renderSwrpgText turns each bracket pair into
// the matching die icon. Falls back to the kind word if we don't have a
// glyph (e.g., the ability/proficiency/etc. fields that shouldn't ever
// surface here). Exported so other surfaces (MiniStatCard) can compose
// matching summaries when they emit pouch logs directly.
export function pouchIconString(kind: keyof DicePouch, count: number): string {
  const code = POUCH_BRACKET_CODE[kind];
  if (!code) return `${count} ${kind}`;
  return `[${code}]`.repeat(count);
}

// Letter and keyword aliases. Lowercased keys; the parser lowercases first.
// Single letters favor the most common roll output (a=advantage, t=threat,
// s=success, f=failure). Triumph/despair/force take longer keys since
// they're rarer and the short letters are reserved.
const POUCH_KIND_ALIASES: Record<string, keyof DicePouch> = {
  a: 'advantage',
  adv: 'advantage',
  advantage: 'advantage',
  t: 'threat',
  thr: 'threat',
  threat: 'threat',
  s: 'success',
  suc: 'success',
  success: 'success',
  f: 'failure',
  fail: 'failure',
  failure: 'failure',
  b: 'boost',
  boost: 'boost',
  k: 'setback',
  setback: 'setback',
  h: 'triumph',
  tri: 'triumph',
  triumph: 'triumph',
  d: 'despair',
  des: 'despair',
  despair: 'despair',
  fo: 'force',
  force: 'force',
};

function parsePouchInput(input: string): { kind: keyof DicePouch; count: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // <digits><letter|word> form: "3b", "1 triumph", "2 success".
  const m = POUCH_INPUT_RE.exec(trimmed);
  if (m) {
    const count = parseInt(m[1], 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    const kind = POUCH_KIND_ALIASES[m[2].toLowerCase()];
    if (!kind) return null;
    return { kind, count };
  }

  // Letters-only inputs cover two shorthand forms:
  //   • repeated-letter count: "bbb" = 3 boost, "aa" = 2 advantage. Also
  //     covers the single-letter case ("d" = 1 despair, "a" = 1 advantage).
  //   • bare keyword: "fo" = 1 force, "triumph" = 1 triumph, "adv" = 1
  //     advantage — anything in POUCH_KIND_ALIASES that isn't a single
  //     same-letter run.
  if (/^[a-zA-Z]+$/.test(trimmed)) {
    const lower = trimmed.toLowerCase();
    if (lower.split('').every((c) => c === lower[0])) {
      const kind = POUCH_KIND_ALIASES[lower[0]];
      if (kind) return { kind, count: lower.length };
    }
    const kind = POUCH_KIND_ALIASES[lower];
    if (kind) return { kind, count: 1 };
  }

  return null;
}

function selectedId(): string | null {
  return useParticipantStore.getState().selectedParticipantId;
}

function selectedName(): string {
  const { participants, selectedParticipantId } = useParticipantStore.getState();
  return participants.find((p) => p.id === selectedParticipantId)?.name ?? 'target';
}

function activeId(): string | null {
  return useGameplayStore.getState().context.activeParticipantId ?? null;
}

export const useQuickActionsStore = create<QuickActionsState>((set) => ({
  mode: 'idle',
  critModalOpen: false,
  effectsModalOpen: false,
  fullSheetOpen: false,
  lastResult: null,

  enterDamage: () => {
    if (!selectedId()) return;
    set({ mode: 'damage', lastResult: null });
  },

  enterStrain: () => {
    const id = selectedId();
    if (!id) return;
    const participant = useParticipantStore
      .getState()
      .participants.find((p) => p.id === id);
    if (!participant) return;
    const tracksStrain =
      participant.isPC || participant.stats?.type === 'Nemesis';
    if (!tracksStrain) {
      set({
        lastResult: {
          ok: false,
          message: `${participant.name} has no strain pool — Minions/Rivals don't track strain.`,
        },
      });
      return;
    }
    set({ mode: 'strain', lastResult: null });
  },

  enterPouch: () => {
    if (!selectedId()) return;
    set({ mode: 'pouch', lastResult: null });
  },

  // W rolls the *active* participant's weapon. When they're aboard a vehicle
  // (equippedVehicleId set), the picker lists the *vehicle's* weapons —
  // pilots/gunners typically fire ship guns, not their sidearms. We branch
  // on this in pickWeapon too so the snapshot uses Gunnery + weaponKind.
  enterWeapon: () => {
    const id = activeId();
    if (!id) {
      set({
        lastResult: { ok: false, message: 'No active participant — set one first (A).' },
      });
      return;
    }
    const participant = useParticipantStore
      .getState()
      .participants.find((p) => p.id === id);
    if (!participant) return;

    const equippedVehicleId = participant.equippedVehicleId;
    const vehicle = equippedVehicleId
      ? useActiveVehicleStore.getState().vehicles[equippedVehicleId]
      : undefined;
    const inVehicle = !!vehicle;

    const raw = inVehicle
      ? (vehicle!.weapons ?? [])
      : ((participant.stats as any)?.weapons as any[] | undefined) ?? [];
    if (raw.length === 0) {
      set({
        lastResult: {
          ok: false,
          message: inVehicle
            ? `${vehicle!.name} has no weapons to roll.`
            : `${participant.name} has no weapons to roll.`,
        },
      });
      return;
    }
    if (raw.length === 1) {
      if (inVehicle) {
        // Single vehicle weapon — roll it directly via the gunnery path.
        const w = raw[0];
        const weaponLike: WeaponLike = {
          name: w.name,
          skill: 'Gunnery',
          damage: w.damage ?? 0,
          critical: w.critical ?? undefined,
          range: w.range ?? '',
          qualities: w.qualities ?? [],
        };
        const stats = (participant.stats ?? {}) as Record<string, any>;
        const skills = (stats.skills as Record<string, number>) ?? {};
        const rank = Object.entries(skills).find(([k]) => k.toLowerCase() === 'gunnery')?.[1] ?? 0;
        const charValue = (stats.agility as number) ?? 0;
        const snap = buildAttackSnapshot(participant, weaponLike, rank, 'agility', charValue, 'vehicle');
        snap.label = `${participant.name} — ${w.name}`;
        useDiceRollerStore.getState().open(snap);
        return;
      }
      const snap = buildDefaultAttackSnapshot(participant);
      if (snap) useDiceRollerStore.getState().open(snap);
      return;
    }
    set({ mode: 'weapon', lastResult: null });
  },

  pickWeapon: (index) => {
    const id = activeId();
    if (!id) return;
    const participant = useParticipantStore
      .getState()
      .participants.find((p) => p.id === id);
    if (!participant) {
      set({ mode: 'idle' });
      return;
    }

    const equippedVehicleId = participant.equippedVehicleId;
    const vehicle = equippedVehicleId
      ? useActiveVehicleStore.getState().vehicles[equippedVehicleId]
      : undefined;

    if (vehicle) {
      const w = vehicle.weapons?.[index];
      if (!w) {
        set({ mode: 'idle' });
        return;
      }
      const weaponLike: WeaponLike = {
        name: w.name,
        skill: 'Gunnery',
        damage: w.damage ?? 0,
        critical: w.critical ?? undefined,
        range: w.range ?? '',
        qualities: w.qualities ?? [],
      };
      const stats = (participant.stats ?? {}) as Record<string, any>;
      const skills = (stats.skills as Record<string, number>) ?? {};
      const rank = Object.entries(skills).find(([k]) => k.toLowerCase() === 'gunnery')?.[1] ?? 0;
      const charValue = (stats.agility as number) ?? 0;
      const snap = buildAttackSnapshot(participant, weaponLike, rank, 'agility', charValue, 'vehicle');
      snap.label = `${participant.name} — ${w.name}`;
      useDiceRollerStore.getState().open(snap);
      set({ mode: 'idle' });
      return;
    }

    const raw = (participant.stats as any)?.weapons as any[] | undefined;
    const rawWeapon = raw?.[index];
    const weapon = rawWeapon ? resolveWeapon(rawWeapon) : null;
    if (!weapon) {
      set({ mode: 'idle' });
      return;
    }
    const s = participant.stats ?? {};
    const characteristics: CharacteristicSet = {
      brawn: s.brawn ?? 2,
      agility: s.agility ?? 2,
      intellect: s.intellect ?? 2,
      cunning: s.cunning ?? 2,
      willpower: s.willpower ?? 2,
      presence: s.presence ?? 2,
    } as CharacteristicSet;
    const aliveMinions = s.minions !== undefined ? s.minions : undefined;
    const { rank, characteristicName, charValue } = resolveSkillForWeapon(
      weapon.skill,
      participant,
      characteristics,
      aliveMinions,
    );
    const snap = buildAttackSnapshot(
      participant,
      weapon,
      rank,
      characteristicName,
      charValue,
    );
    useDiceRollerStore.getState().open(snap);
    set({ mode: 'idle' });
  },

  openCrit: () => {
    if (!selectedId()) return;
    set({ critModalOpen: true });
  },

  closeCrit: () => set({ critModalOpen: false }),

  openEffects: () => {
    if (!selectedId()) return;
    set({ effectsModalOpen: true });
  },

  closeEffects: () => set({ effectsModalOpen: false }),

  openFullSheet: () => {
    if (!selectedId()) return;
    set({ fullSheetOpen: true });
  },

  closeFullSheet: () => set({ fullSheetOpen: false }),

  cancel: () => set({ mode: 'idle' }),

  noteResult: (result) => set({ lastResult: result }),

  submit: (input) => {
    const id = selectedId();
    if (!id) {
      const result: QuickActionResult = { ok: false, message: 'No target selected.' };
      set({ lastResult: result, mode: 'idle' });
      return result;
    }
    const { mode } = useQuickActionsStore.getState();

    if (mode === 'damage') {
      const raw = parseInt(input.trim(), 10);
      if (!Number.isFinite(raw) || raw < 0) {
        const result: QuickActionResult = { ok: false, message: `Invalid damage "${input}".` };
        set({ lastResult: result });
        return result;
      }
      const { applied, soak } = applyDamageWithSoak(id, raw);
      const result: QuickActionResult = {
        ok: true,
        message:
          applied === 0
            ? `${raw} damage soaked (${soak} soak ≥ ${raw}).`
            : `${selectedName()}: ${raw} − ${soak} = ${applied} wounds.`,
      };
      set({ lastResult: result, mode: 'idle' });
      return result;
    }

    if (mode === 'strain') {
      const raw = parseInt(input.trim(), 10);
      if (!Number.isFinite(raw) || raw < 0) {
        const result: QuickActionResult = { ok: false, message: `Invalid strain "${input}".` };
        set({ lastResult: result });
        return result;
      }
      useParticipantStore.getState().addStrain(id, raw);
      const result: QuickActionResult = {
        ok: true,
        message: `${selectedName()}: +${raw} strain.`,
      };
      set({ lastResult: result, mode: 'idle' });
      return result;
    }

    if (mode === 'pouch') {
      const parsed = parsePouchInput(input);
      if (!parsed) {
        const result: QuickActionResult = {
          ok: false,
          message: `Couldn't parse "${input}". Try "3a", "1 triumph", "2 success".`,
        };
        set({ lastResult: result });
        return result;
      }
      useParticipantStore.getState().addDice(id, parsed.kind, parsed.count, 'Quick action');
      useSessionLogStore.getState().log({
        kind: 'effect-added',
        participantId: id,
        participantName: selectedName(),
        summary: `${pouchIconString(parsed.kind, parsed.count)} was added to ${selectedName()}'s pouch`,
        tone: 'info',
      });
      const result: QuickActionResult = {
        ok: true,
        message: `+${parsed.count} ${parsed.kind} to ${selectedName()}'s pouch.`,
      };
      set({ lastResult: result, mode: 'idle' });
      return result;
    }

    return { ok: false, message: 'Nothing to submit.' };
  },
}));

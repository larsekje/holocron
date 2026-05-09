import {nanoid} from 'nanoid';
import type {Participant} from '@/state/participantsStore';
import useParticipantStore from '@/state/participantsStore';
import type {ModalSnapshot, SnapshotAttacker, SnapshotTarget, SnapshotWeapon} from '@components/dice/mockSnapshots';
import type {DicePool} from '@/engine/diceEngine';

export function snapshotTargetFromParticipant(p: Participant): SnapshotTarget {
  const stats = (p.stats ?? {}) as Record<string, any>;
  return {
    name: p.name,
    soak: stats.soak ?? 0,
    meleeDef: stats.meleeDefense ?? 0,
    rangedDef: stats.rangedDefense ?? 0,
    wounds: stats.wounds ?? 0,
    woundThreshold: stats.woundThreshold ?? (p.isPC ? 12 : 8),
  };
}

export const RANGE_DIFFICULTY_TABLE: Record<SnapshotWeapon['range'], { count: number; label: string; presetId: string }> = {
  // Melee attacks at engaged range are Average (2 purple) by core SWRPG rules.
  // Ranged-Light/Heavy penalties at engaged are layered via the Modifiers
  // popover, not baked into the base.
  engaged: { count: 2, label: 'Average',  presetId: 'difficulty-average' },
  short:   { count: 1, label: 'Easy',     presetId: 'difficulty-easy' },
  medium:  { count: 2, label: 'Average',  presetId: 'difficulty-average' },
  long:    { count: 3, label: 'Hard',     presetId: 'difficulty-hard' },
  extreme: { count: 4, label: 'Daunting', presetId: 'difficulty-daunting' },
};

function snapshotAttackerFromParticipant(p: Participant): SnapshotAttacker {
  const stats = p.stats || {};
  return {
    name: p.name,
    characteristics: {
      brawn: stats.brawn ?? 2,
      agility: stats.agility ?? 2,
      intellect: stats.intellect ?? 2,
      cunning: stats.cunning ?? 2,
      willpower: stats.willpower ?? 2,
      presence: stats.presence ?? 2,
    },
    skills: (stats.skills as Record<string, number>) ?? {},
  };
}

// Skill rank + characteristic value → { ability, proficiency } (the green/yellow split).
function skillPool(rank: number, charValue: number): {ability: number; proficiency: number} {
  const yellow = Math.min(rank, charValue);
  const green = Math.max(rank, charValue) - yellow;
  return {ability: green, proficiency: yellow};
}

// Empty snapshot for the freestanding dice button on the top bar — no
// attacker, no weapon, no skill context. The user adds dice manually.
export function buildFreestandingSnapshot(): ModalSnapshot {
  return {
    id: nanoid(),
    label: 'Freestanding roll',
    mode: 'basic',
    pool: {},
    appliedPresets: [],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

function skillSources(_skillName: string, rank: number, charValue: number): Partial<Record<string, string[]>> {
  const yellow = Math.min(rank, charValue);
  const green = Math.max(rank, charValue) - yellow;
  const sources: Partial<Record<string, string[]>> = {};
  if (green > 0)  sources.ability     = Array(green).fill('Skill');
  if (yellow > 0) sources.proficiency = Array(yellow).fill('Skill');
  return sources;
}

export function buildSkillCheckSnapshot(
  participant: Participant,
  skillName: string,
  characteristic: string,
  rank: number,
  charValue: number,
): ModalSnapshot {
  const pool: DicePool = {...skillPool(rank, charValue), difficulty: 2};
  return {
    id: nanoid(),
    label: `${participant.name} — ${skillName}`,
    mode: 'basic',
    difficultyLabel: 'Average',
    attacker: snapshotAttackerFromParticipant(participant),
    attackerParticipantId: participant.id,
    skill: skillName,
    characteristic,
    pool,
    poolSources: {
      ...skillSources(skillName, rank, charValue),
      difficulty: ['Difficulty', 'Difficulty'],
    } as ModalSnapshot['poolSources'],
    appliedPresets: ['difficulty-average'],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

export interface WeaponLike {
  name: string;
  skill: string;
  damage: number | string;
  critical?: number | string;
  crit?: number | string;
  range: string;
  qualities?: string[];
  notes?: string;
}

// Map a weapon's "range" string ('Engaged', 'Short', etc) to the SnapshotWeapon enum.
function normaliseRange(r: string): SnapshotWeapon['range'] {
  const lower = (r || '').toLowerCase();
  if (lower.includes('engage')) return 'engaged';
  if (lower.includes('short')) return 'short';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('extreme')) return 'extreme';
  if (lower.includes('long')) return 'long';
  return 'short';
}

// Holocron v2 PDF table 2-6: Attack Difficulty by range. Re-exports the shared
// table for callers that already imported the local name.
const RANGE_DIFFICULTY = RANGE_DIFFICULTY_TABLE;

function parseQualities(qualities: string[] | undefined): SnapshotWeapon['qualities'] {
  if (!qualities) return [];
  return qualities.map((q) => {
    const m = q.match(/^(.+?)\s+(\d+)$/);
    if (m) return {name: m[1], rank: parseInt(m[2], 10)};
    return {name: q};
  });
}

export function buildAttackSnapshot(
  participant: Participant,
  weapon: WeaponLike,
  resolvedSkillRank: number,
  resolvedCharacteristic: string,
  resolvedCharValue: number,
): ModalSnapshot {
  const range = normaliseRange(weapon.range);
  const diff = RANGE_DIFFICULTY[range];
  const pool: DicePool = { ...skillPool(resolvedSkillRank, resolvedCharValue), difficulty: diff.count };
  const damageValue = typeof weapon.damage === 'string' ? parseInt(weapon.damage, 10) : weapon.damage;
  const critValue = typeof weapon.critical === 'string'
    ? parseInt(weapon.critical, 10)
    : (weapon.critical ?? (typeof weapon.crit === 'string' ? parseInt(weapon.crit, 10) : weapon.crit) ?? 0);

  // Auto-target = whoever is currently "Targeted" (selectedParticipantId).
  // Same source the Targeted panel reads, no equality filtering.
  const ps = useParticipantStore.getState();
  const selectedId = ps.selectedParticipantId;
  const selectedTarget = selectedId
    ? ps.participants.find((p) => p.id === selectedId)
    : undefined;

  return {
    id: nanoid(),
    label: `${participant.name} — ${weapon.name}`,
    mode: 'combat',
    difficultyLabel: diff.label,
    attacker: snapshotAttackerFromParticipant(participant),
    attackerParticipantId: participant.id,
    targetParticipantId: selectedTarget?.id,
    target: selectedTarget ? snapshotTargetFromParticipant(selectedTarget) : undefined,
    skill: weapon.skill,
    characteristic: resolvedCharacteristic,
    weapon: {
      name: weapon.name,
      skill: weapon.skill,
      damage: Number.isFinite(damageValue) ? (damageValue as number) : 0,
      crit: Number.isFinite(critValue as number) ? (critValue as number) : 0,
      range,
      baseRange: range,
      qualities: parseQualities(weapon.qualities),
    },
    pool,
    poolSources: {
      ...skillSources(weapon.skill || 'weapon', resolvedSkillRank, resolvedCharValue),
      difficulty: Array(diff.count).fill('Difficulty'),
    } as ModalSnapshot['poolSources'],
    appliedPresets: [diff.presetId],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

import {nanoid} from 'nanoid';
import type {Participant} from '@/state/participantsStore';
import type {ModalSnapshot, SnapshotAttacker, SnapshotWeapon} from '@components/dice/mockSnapshots';
import type {DicePool} from '@/engine/diceEngine';

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
    skill: skillName,
    characteristic,
    pool,
    appliedPresets: [],
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
  const pool: DicePool = {...skillPool(resolvedSkillRank, resolvedCharValue), difficulty: 2};
  const damageValue = typeof weapon.damage === 'string' ? parseInt(weapon.damage, 10) : weapon.damage;
  const critValue = typeof weapon.critical === 'string'
    ? parseInt(weapon.critical, 10)
    : (weapon.critical ?? (typeof weapon.crit === 'string' ? parseInt(weapon.crit, 10) : weapon.crit) ?? 0);

  return {
    id: nanoid(),
    label: `${participant.name} — ${weapon.name}`,
    mode: 'basic',
    difficultyLabel: 'Average',
    attacker: snapshotAttackerFromParticipant(participant),
    skill: weapon.skill,
    characteristic: resolvedCharacteristic,
    weapon: {
      name: weapon.name,
      skill: weapon.skill,
      damage: Number.isFinite(damageValue) ? (damageValue as number) : 0,
      crit: Number.isFinite(critValue as number) ? (critValue as number) : 0,
      range: normaliseRange(weapon.range),
      qualities: parseQualities(weapon.qualities),
    },
    pool,
    appliedPresets: [],
    result: null,
    spent: [],
  };
}

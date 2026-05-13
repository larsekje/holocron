import type { Participant } from '@/state/participantsStore';
import { buildSkillCheckSnapshot, buildAttackSnapshot } from '@/utils/diceSnapshots';
import { resolveWeapon, resolveSkillForWeapon } from '@components/statblock/WeaponListOld';
import skillsData from '@/assets/data/skills.json';
import type { CharacteristicSet } from '@components/statblock/CharacteristicsOld';

interface SkillDef {
  name: string;
  characteristic: string;
  type?: string;
}

// Derive the 6-axis characteristic set from a participant's flat stats fields.
function characteristicsFor(participant: Participant): CharacteristicSet {
  const s = participant.stats ?? {};
  return {
    brawn: s.brawn ?? 2,
    agility: s.agility ?? 2,
    intellect: s.intellect ?? 2,
    cunning: s.cunning ?? 2,
    willpower: s.willpower ?? 2,
    presence: s.presence ?? 2,
  } as CharacteristicSet;
}

// Pick the highest-rank skill the participant actually has trained (rank > 0)
// and build a SkillCheckSnapshot suitable for openDiceRoller(). The GM can
// still swap to a different skill from the roller UI once it opens.
export function buildDefaultSkillSnapshot(participant: Participant) {
  const profileSkills = participant.stats?.skills as
    | Record<string, number>
    | string[]
    | undefined;
  if (!profileSkills) return null;

  // Normalize to a {name, rank} list. The array form (legacy minion data)
  // implies rank-1 for each named skill.
  const ranked: { name: string; rank: number }[] = Array.isArray(profileSkills)
    ? profileSkills.map((name) => ({ name, rank: 1 }))
    : Object.entries(profileSkills).map(([name, rank]) => ({ name, rank: rank ?? 0 }));

  const best = ranked
    .filter((s) => s.rank > 0)
    .sort((a, b) => b.rank - a.rank)[0];
  if (!best) return null;

  // Look up the canonical characteristic for this skill. Lightsaber variants
  // encode their characteristic in parens (e.g. "Lightsaber (Willpower)"); honor
  // that override before falling back to the master skill definition.
  const overrideMatch = best.name.match(/\(([^)]+)\)/);
  const baseName = overrideMatch ? best.name.replace(/\s*\([^)]+\)\s*$/, '') : best.name;
  const skillDef = (skillsData as SkillDef[]).find(
    (s) => s.name.toLowerCase() === baseName.toLowerCase(),
  );
  const characteristic = (overrideMatch?.[1] ?? skillDef?.characteristic ?? 'brawn').toLowerCase();
  const characteristics = characteristicsFor(participant);
  const charValue = (characteristics as Record<string, number>)[characteristic] ?? 0;

  return buildSkillCheckSnapshot(participant, best.name, characteristic, best.rank, charValue);
}

// Pick the first weapon on the participant's profile and build an AttackSnapshot.
// Returns null if there are no weapons.
export function buildDefaultAttackSnapshot(participant: Participant) {
  const rawWeapons = (participant.stats as any)?.weapons as Array<any> | undefined;
  if (!rawWeapons || rawWeapons.length === 0) return null;
  const weapon = resolveWeapon(rawWeapons[0]);
  if (!weapon) return null;

  const characteristics = characteristicsFor(participant);
  const aliveMinions =
    participant.stats?.minions !== undefined ? participant.stats.minions : undefined;
  const { rank, characteristicName, charValue } = resolveSkillForWeapon(
    weapon.skill,
    participant,
    characteristics,
    aliveMinions,
  );
  return buildAttackSnapshot(participant, weapon, rank, characteristicName, charValue);
}

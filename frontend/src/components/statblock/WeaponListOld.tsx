import React from 'react';
import {Flex, Text, VStack} from "@chakra-ui/react";
import WeaponCardOld from "./WeaponCardOld";
import {DicePool} from "./DicePoolOld";
import type {Participant} from "@/state/participantsStore";
import type {CharacteristicSet} from "./CharacteristicsOld";
import useDiceRollerStore from "@/state/diceRollerStore";
import {buildAttackSnapshot, type WeaponLike} from "@/utils/diceSnapshots";
import {getDetail} from "@/data/spotlightIndex";

interface Props {
  participant: Participant;
  characteristics: CharacteristicSet;
  // For minion groups, used to compute SWRPG minion-rule rank
  // (rank in any listed skill = max(0, aliveMinions - 1)).
  aliveMinions?: number;
}

function weaponSlug(name: string): string {
  return (
    "weapon_" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

// Resolve a weapon entry from the adversary profile to a flat WeaponLike object.
function resolveWeapon(raw: any): WeaponLike | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const detail = getDetail("weapon", weaponSlug(raw));
    if (!detail) return {name: raw, skill: "", damage: 0, range: "", qualities: []};
    const d = detail as any;
    return {
      name: d.name ?? raw,
      skill: d.skill ?? "",
      damage: d.damage ?? 0,
      crit: d.crit ?? d.critical,
      range: d.range ?? "",
      qualities: d.qualities ?? [],
    };
  }
  return {
    name: raw.name ?? "Weapon",
    skill: raw.skill ?? "",
    damage: raw.damage ?? raw.plusDamage ?? 0,
    critical: raw.critical,
    crit: raw.crit,
    range: raw.range ?? "",
    qualities: raw.qualities ?? [],
    notes: raw.notes,
  };
}

// Resolve the rank + characteristic actually used by this weapon's skill (e.g. Lightsaber
// (Willpower) → use Willpower with that rank), accounting for minion-group rule when active.
function resolveSkillForWeapon(
  weaponSkill: string,
  participant: Participant,
  characteristics: CharacteristicSet,
  aliveMinions: number | undefined,
): {rank: number; characteristicName: string; charValue: number} {
  const profileSkills = (participant.stats?.skills as Record<string, number>) ?? {};
  const lower = weaponSkill.toLowerCase();

  // Try exact case-insensitive match
  let storedRank = 0;
  let charOverride: string | undefined;
  for (const [k, v] of Object.entries(profileSkills)) {
    if (k.toLowerCase() === lower) {
      storedRank = v ?? 0;
      const m = k.match(/\(([^)]+)\)/);
      if (m) charOverride = m[1].toLowerCase();
      break;
    }
  }
  // If weaponSkill itself encodes the characteristic override (e.g. "Lightsaber (Willpower)")
  if (!charOverride) {
    const m = weaponSkill.match(/\(([^)]+)\)/);
    if (m) charOverride = m[1].toLowerCase();
  }
  // Fallback: pick a guess from name root if it's a Lightsaber base; otherwise undefined
  const characteristicName = charOverride ?? "brawn";
  const charValue = (characteristics as Record<string, number>)[characteristicName] ?? 0;

  // Minion group: listed-skill rank = max(0, alive - 1) regardless of stored value
  const isMinionGroup = aliveMinions !== undefined;
  const rank = isMinionGroup
    ? (storedRank > 0 ? Math.max(0, (aliveMinions as number) - 1) : 0)
    : storedRank;

  return {rank, characteristicName, charValue};
}

const WeaponListOld = ({participant, characteristics, aliveMinions}: Props) => {
  const openDiceRoller = useDiceRollerStore((s) => s.open);
  const rawWeapons = (participant.stats as any)?.weapons as Array<any> | undefined;
  if (!rawWeapons || rawWeapons.length === 0) return null;

  const items = rawWeapons.map((raw, i) => {
    const w = resolveWeapon(raw);
    if (!w) return null;
    const {rank, characteristicName, charValue} = resolveSkillForWeapon(
      w.skill,
      participant,
      characteristics,
      aliveMinions,
    );
    const yellow = Math.min(rank, charValue);
    const green = Math.max(rank, charValue) - yellow;
    const pool = new DicePool(green, yellow);

    return (
      <WeaponCardOld
        key={`${w.name}-${i}`}
        weapon={w}
        pool={pool}
        onClick={() =>
          openDiceRoller(buildAttackSnapshot(participant, w, rank, characteristicName, charValue))
        }
      />
    );
  });

  return (
    <>
      <Flex align="center" justify="space-between" mt={4} mb={1}>
        <Text
          as="b"
          fontSize="10px"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color="#d39939"
        >
          Weapons
        </Text>
      </Flex>
      <VStack align="stretch" spacing={2}>
        {items.length > 0 ? items : <Text fontSize="sm" color="whiteAlpha.700">None</Text>}
      </VStack>
    </>
  );
};

export default WeaponListOld;

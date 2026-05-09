import React, {useState} from 'react';
import {
  Box,
  Checkbox,
  Divider,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  useMediaQuery,
} from "@chakra-ui/react";
import SkillItemOld from "./SkillItemOld";
import {DicePool} from "./DicePoolOld";
import skills from "@/assets/data/skills.json";
import type {CharacteristicSet} from "./CharacteristicsOld";
import type {Participant} from "@/state/participantsStore";
import useDiceRollerStore from "@/state/diceRollerStore";
import {buildSkillCheckSnapshot} from "@/utils/diceSnapshots";

interface SkillDef {
  name: string;
  characteristic: string;
  type?: string;
}

interface Props {
  participant: Participant;
  // Adversaries on the new model store skills as Record<string, number>.
  // Some minion data still encodes them as a string[] of skill names; both are accepted.
  profileSkills: Record<string, number> | string[];
  characteristics: CharacteristicSet;
  currentCharacteristic?: string;
  // For minion groups: how many minions are currently alive. When provided,
  // listed-skill rank is overridden by the standard SWRPG minion rule
  // (rank = max(0, aliveMinions - 1)) regardless of stored rank.
  aliveMinions?: number;
}

class SkillEntry {
  displayName: string;
  characteristicName: string;
  rank: number;
  pool: DicePool;
  listed: boolean;

  constructor(displayName: string, characteristicName: string, rank: number, characteristicValue: number, listed: boolean) {
    this.displayName = displayName;
    this.characteristicName = characteristicName;
    this.rank = rank;
    this.pool = new DicePool(rank, characteristicValue);
    this.listed = listed;
  }
}

function isRecord(obj: unknown): obj is Record<string, number> {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

interface ProfileMatch {
  listed: boolean;
  storedRank: number;
  characteristicOverride?: string;
}

// Lightsaber's characteristic varies per character (e.g. "Lightsaber (Willpower)" stored on the
// profile means roll Willpower). When matching the master "Lightsaber" entry, fall back to any
// "Lightsaber (X)" variant present on the profile.
function matchProfile(fullName: string, profileSkills: Record<string, number> | string[]): ProfileMatch {
  if (isRecord(profileSkills)) {
    const lower = fullName.toLowerCase();
    for (const [k, v] of Object.entries(profileSkills)) {
      if (k.toLowerCase() === lower) return {listed: (v ?? 0) > 0, storedRank: v ?? 0};
    }
    if (fullName.toLowerCase() === "lightsaber") {
      for (const [k, v] of Object.entries(profileSkills)) {
        const m = k.match(/^\s*lightsaber\s*\(\s*([^)]+?)\s*\)\s*$/i);
        if (m && (v ?? 0) > 0) {
          return {listed: true, storedRank: v ?? 0, characteristicOverride: m[1].toLowerCase()};
        }
      }
    }
    return {listed: false, storedRank: 0};
  }
  // array form (legacy minion list of skill names)
  if (fullName.toLowerCase() === "lightsaber") {
    const variant = profileSkills.find((s) => /^\s*lightsaber\s*\(/i.test(s));
    if (variant) {
      const m = variant.match(/^\s*lightsaber\s*\(\s*([^)]+?)\s*\)\s*$/i);
      return {listed: true, storedRank: 1, characteristicOverride: m?.[1].toLowerCase()};
    }
  }
  const listed = profileSkills.some((s) => s.toLowerCase() === fullName.toLowerCase());
  return {listed, storedRank: listed ? 1 : 0};
}

function characteristicValue(name: string, characteristics: CharacteristicSet): number {
  const key = name.toLowerCase() as keyof CharacteristicSet;
  return (characteristics as Record<string, number>)[key] ?? 0;
}

// Reorder so a 2- or 3-column SimpleGrid reads top-to-bottom rather than left-to-right.
function rearrange<T>(items: T[], columns: number): T[] {
  if (columns <= 1) return items;
  const numRows = Math.ceil(items.length / columns);
  const out: T[] = [];
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < columns; j++) {
      const index = j * numRows + i;
      if (index < items.length) out.push(items[index]);
    }
  }
  return out;
}

const SkillListOld = ({participant, profileSkills, characteristics, currentCharacteristic = "", aliveMinions}: Props) => {
  // Default to listed-only — toggle "Show all" to expand.
  const [showAll, setShowAll] = useState(false);
  const [isSmallScreen] = useMediaQuery("(max-width: 1668px)");
  const [isLargeScreen] = useMediaQuery("(min-width: 2500px)");
  const openDiceRoller = useDiceRollerStore((s) => s.open);

  const isMinionGroup = aliveMinions !== undefined;
  // SWRPG minion-group rule: rank in any listed skill = (group_size - 1) using
  // current alive-minions; non-listed skills stay at 0.
  const minionGroupRank = isMinionGroup ? Math.max(0, (aliveMinions as number) - 1) : 0;

  // Master list: drop parenthesized variants (Lightsaber X / Brawl Knowledge etc.) but keep the
  // base entries. Variants are still matched against the profile via matchProfile.
  let entries: SkillEntry[] = (skills as SkillDef[])
    .filter((s) => !s.name.includes("("))
    .map((s) => {
      const match = matchProfile(s.name, profileSkills);
      const characteristicName = (match.characteristicOverride ?? s.characteristic).toLowerCase();
      const stat = characteristicValue(characteristicName, characteristics);
      const rank = isMinionGroup ? (match.listed ? minionGroupRank : 0) : match.storedRank;
      // Display: drop the "Knowledge: " prefix for compactness; for Lightsaber variants tag the
      // chosen characteristic so it's visible at a glance.
      let displayName = s.name.replace(/^Knowledge:\s+/, "");
      if (s.name.toLowerCase() === "lightsaber" && match.characteristicOverride) {
        const cap = match.characteristicOverride.charAt(0).toUpperCase() + match.characteristicOverride.slice(1, 3);
        displayName = `Lightsaber (${cap})`;
      }
      return new SkillEntry(displayName, characteristicName, rank, stat, match.listed);
    });

  if (!showAll) {
    entries = entries.filter((e) => e.listed);
  }

  const columns = entries.length <= 5 ? 1 : isSmallScreen ? 1 : isLargeScreen ? 3 : 2;
  entries = rearrange(entries, columns);

  return (
    <Box padding="0 5px">
      <HStack justifyContent="space-between" paddingBottom="5px" paddingTop="10px">
        <Heading size="md" as="h2" color="white">Skills</Heading>
        <HStack>
          <Text color="white" fontSize="sm">Show all</Text>
          <Checkbox onChange={() => setShowAll(!showAll)} isChecked={showAll}/>
        </HStack>
      </HStack>
      <Divider/>
      {entries.length === 0 && !showAll && (
        <Text color="whiteAlpha.700" fontSize="sm" mt={2}>
          No listed skills. Toggle "Show all" to see the full skill list.
        </Text>
      )}
      <SimpleGrid spacingX={3} columns={columns}>
        {entries.map((skill) => {
          const charValue = (characteristics as Record<string, number>)[skill.characteristicName] ?? 0;
          return (
            <SkillItemOld
              key={skill.displayName}
              name={skill.displayName}
              characteristic={skill.characteristicName}
              rank={skill.rank}
              pool={skill.pool}
              group={isMinionGroup && skill.listed}
              abbreviated={isSmallScreen}
              currentCharacteristic={currentCharacteristic}
              onClick={() =>
                openDiceRoller(
                  buildSkillCheckSnapshot(
                    participant,
                    skill.displayName,
                    skill.characteristicName,
                    skill.rank,
                    charValue,
                  ),
                )
              }
            />
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default SkillListOld;

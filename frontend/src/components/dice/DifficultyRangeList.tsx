import React from 'react';
import { HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';
import type { DiceRollMode, SnapshotWeapon } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';
import { RANGE_DIFFICULTY_TABLE } from '@/utils/diceSnapshots';

interface DifficultyTier {
  id: string;
  label: string;
  pips: number;
}

const DIFFICULTY_TIERS: DifficultyTier[] = [
  { id: 'difficulty-easy',       label: 'Easy',       pips: 1 },
  { id: 'difficulty-average',    label: 'Average',    pips: 2 },
  { id: 'difficulty-hard',       label: 'Hard',       pips: 3 },
  { id: 'difficulty-daunting',   label: 'Daunting',   pips: 4 },
  { id: 'difficulty-formidable', label: 'Formidable', pips: 5 },
];

interface RangeTier {
  id: SnapshotWeapon['range'];
  label: string;
  presetId: string;
  pips: number;
  reminder: string;
}

const RANGE_REMINDERS: Record<NonNullable<SnapshotWeapon['range']>, string> = {
  engaged: 'touching / hand-to-hand — Light +1 diff, Heavy +2 diff, no Gunnery',
  short: 'same room, normal conversation',
  medium: 'across the street, raised voice',
  long: 'across a courtyard, ~100 m',
  extreme: 'edge of perception, ~500 m',
};

const RANGE_TIERS: RangeTier[] = (['engaged', 'short', 'medium', 'long', 'extreme'] as const).map(
  (r) => {
    const t = RANGE_DIFFICULTY_TABLE[r];
    return {
      id: r,
      label: r === 'engaged' ? 'Engaged' : r[0].toUpperCase() + r.slice(1),
      presetId: t.presetId,
      pips: t.count,
      reminder: RANGE_REMINDERS[r],
    };
  },
);

interface Props {
  mode: DiceRollMode;
  appliedPresetIds: string[];
  weaponRange?: SnapshotWeapon['range'];
}

const PipRow: React.FC<{ pips: number; challenge?: number }> = ({ pips, challenge = 0 }) => {
  if (pips === 0 && challenge === 0) {
    return (
      <Text fontSize="9px" color="gray.500" lineHeight="1">
        —
      </Text>
    );
  }
  return (
    <HStack spacing="1px">
      {Array.from({ length: pips }).map((_, i) => (
        <DifficultySvg key={`d-${i}`} width={10} />
      ))}
      {Array.from({ length: challenge }).map((_, i) => (
        <ChallengeSvg key={`c-${i}`} width={10} />
      ))}
    </HStack>
  );
};

// Vertical list of difficulty tiers (or ranges in combat mode), shown beside
// the dice palette. Selecting a row sets the difficulty pip count via the
// store; in combat mode it also updates the weapon's range so the CombatPanel
// header stays in sync.
export const DifficultyRangeList: React.FC<Props> = ({ mode, appliedPresetIds, weaponRange }) => {
  const setDifficulty = useDiceRollerStore((s) => s.setDifficulty);
  const update = useDiceRollerStore((s) => s.update);
  const snapshot = useDiceRollerStore((s) => s.snapshot);

  if (mode === 'opposed' || mode === 'skillChallenge') return null;

  const applied = new Set(appliedPresetIds);
  const isCombat = mode === 'combat';

  const renderRow = (
    key: string,
    label: string,
    isActive: boolean,
    pips: number,
    onClick: () => void,
    tooltip: string,
    dimmed = false,
  ) => (
    <Tooltip key={key} label={tooltip} placement="left" hasArrow openDelay={400}>
      <HStack
        as="button"
        onClick={onClick}
        spacing={2}
        px={2}
        h="16px"
        flex="0 0 16px"
        borderRadius="sm"
        bg={isActive ? 'purple.700' : 'transparent'}
        color={isActive ? 'whiteAlpha.900' : 'gray.400'}
        opacity={dimmed && !isActive ? 0.35 : 1}
        _hover={{ bg: isActive ? 'purple.600' : 'whiteAlpha.50', opacity: 1 }}
        justify="space-between"
        minW="140px"
      >
        <Text fontSize="11px" fontWeight={isActive ? 'bold' : 'normal'} lineHeight="1">
          {label}
        </Text>
        <PipRow pips={pips} />
      </HStack>
    </Tooltip>
  );

  if (isCombat) {
    const baseRange = snapshot?.weapon?.baseRange;
    const baseRangeIdx = baseRange ? RANGE_TIERS.findIndex((t) => t.id === baseRange) : -1;

    return (
      <VStack align="stretch" spacing={0}>
        {RANGE_TIERS.map((r, idx) => {
          const isActive = weaponRange === r.id;
          const outOfReach = baseRangeIdx >= 0 && idx > baseRangeIdx;
          return renderRow(
            r.id,
            r.label,
            isActive,
            r.pips,
            () => {
              const weapon = snapshot?.weapon;
              if (weapon) update({ weapon: { ...weapon, range: r.id } });
              setDifficulty(r.presetId, r.pips, 'Difficulty');
            },
            `${r.label} — ${r.reminder} (${r.pips} difficulty)`,
            outOfReach,
          );
        })}
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={0}>
      {DIFFICULTY_TIERS.map((tier) => {
        const isActive = applied.has(tier.id);
        return renderRow(
          tier.id,
          tier.label,
          isActive,
          tier.pips,
          () => setDifficulty(tier.id, tier.pips),
          `${tier.label} — ${tier.pips} difficulty`,
        );
      })}
    </VStack>
  );
};


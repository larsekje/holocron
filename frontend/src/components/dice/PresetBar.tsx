import React from 'react';
import { Button, ButtonGroup, HStack, Tooltip } from '@chakra-ui/react';
import type { DiceRollMode } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';

interface DiffTier {
  id: string;
  label: string;
  pips: number;
}

const DIFFICULTY_TIERS: DiffTier[] = [
  { id: 'difficulty-simple',     label: 'Simple',     pips: 0 },
  { id: 'difficulty-easy',       label: 'Easy',       pips: 1 },
  { id: 'difficulty-average',    label: 'Average',    pips: 2 },
  { id: 'difficulty-hard',       label: 'Hard',       pips: 3 },
  { id: 'difficulty-daunting',   label: 'Daunting',   pips: 4 },
  { id: 'difficulty-formidable', label: 'Formidable', pips: 5 },
];

interface PresetBarProps {
  mode: DiceRollMode;
  appliedPresetIds: string[];
}

export const PresetBar: React.FC<PresetBarProps> = ({ mode, appliedPresetIds }) => {
  const setDifficulty = useDiceRollerStore((s) => s.setDifficulty);
  if (mode === 'opposed' || mode === 'skillChallenge') return null;
  const applied = new Set(appliedPresetIds);

  return (
    <HStack justify="center">
      <ButtonGroup size="xs" isAttached variant="outline">
        {DIFFICULTY_TIERS.map((tier) => {
          const isActive = applied.has(tier.id);
          return (
            <Tooltip
              key={tier.id}
              label={`${tier.pips} difficulty ${tier.pips === 1 ? 'die' : 'dice'}`}
              placement="top"
              hasArrow
              openDelay={300}
            >
              <Button
                colorScheme={isActive ? 'purple' : 'gray'}
                variant={isActive ? 'solid' : 'outline'}
                onClick={() => setDifficulty(tier.id, tier.pips)}
              >
                {tier.label}
              </Button>
            </Tooltip>
          );
        })}
      </ButtonGroup>
    </HStack>
  );
};

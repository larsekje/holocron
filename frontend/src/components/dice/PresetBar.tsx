import React from 'react';
import { Button, HStack, Text } from '@chakra-ui/react';
import type { DiceRollMode } from './mockSnapshots';

const DIFFICULTY_TIERS = [
  { id: 'difficulty-simple',     label: 'Simple' },
  { id: 'difficulty-easy',       label: 'Easy' },
  { id: 'difficulty-average',    label: 'Average' },
  { id: 'difficulty-hard',       label: 'Hard' },
  { id: 'difficulty-daunting',   label: 'Daunting' },
  { id: 'difficulty-formidable', label: 'Formidable' },
];

interface PresetBarProps {
  mode: DiceRollMode;
  appliedPresetIds: string[];
}

/**
 * Just a difficulty-tier picker. Other situational modifiers (cover, lighting,
 * range, etc.) were dropped from the preset bar — too cumbersome to enumerate per
 * check, easier to add their dice manually via the "Add" row.
 */
export const PresetBar: React.FC<PresetBarProps> = ({ mode, appliedPresetIds }) => {
  // Opposed mode derives difficulty from the defender; skill challenge is its own flow.
  if (mode === 'opposed' || mode === 'skillChallenge') return null;
  const applied = new Set(appliedPresetIds);

  return (
    <HStack spacing={1.5} align="center" wrap="wrap">
      <Text fontSize="xs" color="gray.500" minW="36px">DIFF</Text>
      {DIFFICULTY_TIERS.map((tier) => {
        const isActive = applied.has(tier.id);
        return (
          <Button
            key={tier.id}
            size="xs"
            variant={isActive ? 'solid' : 'outline'}
            colorScheme={isActive ? 'purple' : 'gray'}
            onClick={() => undefined}
          >
            {tier.label}
          </Button>
        );
      })}
    </HStack>
  );
};

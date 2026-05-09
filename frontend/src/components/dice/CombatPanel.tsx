import React from 'react';
import { HStack, Text } from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';

interface Props {
  snapshot: ModalSnapshot;
}

// Combat-mode header: weapon stats + auto-derived target line. Range is
// changed via the Range list on the right (DifficultyRangeList in combat
// mode). Damage breakdown lives below the Roll button in CombatDamagePanel.
export const CombatPanel: React.FC<Props> = ({ snapshot }) => {
  const { weapon, target } = snapshot;

  if (!weapon) {
    return (
      <Text fontSize="sm" color="gray.500">
        Combat mode requires a weapon.
      </Text>
    );
  }

  return (
    <HStack justify="space-between" align="center" px={1} flexWrap="wrap" rowGap={1}>
      <HStack spacing={2} fontSize="sm">
        <Text color="gray.100" fontWeight="semibold">{weapon.name}</Text>
        <Text color="gray.500">{`Dmg ${weapon.damage} · Crit ${weapon.crit}`}</Text>
      </HStack>

      {target && (
        <HStack spacing={2} fontSize="sm">
          <Text color="gray.500">{`Soak ${target.soak} · ${target.wounds}/${target.woundThreshold}`}</Text>
          <Text color="gray.600">→</Text>
          <Text color="gray.100" fontWeight="semibold">{target.name}</Text>
        </HStack>
      )}
    </HStack>
  );
};

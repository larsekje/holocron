import React from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';

interface OpposedPanelProps {
  snapshot: ModalSnapshot;
}

/**
 * Opposed-specific extra: defender contribution strip. Pool/result and spends are
 * handled by the modal.
 */
export const OpposedPanel: React.FC<OpposedPanelProps> = ({ snapshot }) => {
  const { defender, pool } = snapshot;

  if (!defender) {
    return (
      <Text fontSize="sm" color="gray.500">
        Opposed mode requires a defender.
      </Text>
    );
  }

  const defDifficulty = pool.difficulty ?? 0;
  const defChallenge = pool.challenge ?? 0;
  const defenderDiceCount = defDifficulty + defChallenge;

  return (
    <Box bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" p={3}>
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">
            Opposed by
          </Text>
          <Text fontSize="sm" color="gray.100" fontWeight="semibold">{defender.name}</Text>
          <Text fontSize="xs" color="gray.500" textTransform="capitalize">
            {defender.characteristic} {defender.characteristicValue} · {defender.skill} {defender.skillRank}
          </Text>
        </VStack>
        <VStack align="end" spacing={0}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">
            Difficulty derived
          </Text>
          <Text fontSize="sm" color="gray.300">
            {defenderDiceCount} dice · {defChallenge} upgraded
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

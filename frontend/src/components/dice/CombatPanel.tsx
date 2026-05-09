import React from 'react';
import { Box, Button, HStack, Text, VStack, useToast } from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';

interface CombatPanelProps {
  snapshot: ModalSnapshot;
}

/**
 * Combat-specific extras: weapon/target context strip, damage breakdown,
 * apply-to-target button. Pool/result and spends are handled by the modal.
 */
export const CombatPanel: React.FC<CombatPanelProps> = ({ snapshot }) => {
  const toast = useToast();
  const { weapon, target, result } = snapshot;

  if (!weapon || !target) {
    return (
      <Text fontSize="sm" color="gray.500">
        Combat mode requires a weapon and target.
      </Text>
    );
  }

  const netSuccess = result?.net.netSuccess ?? 0;
  const succeeded = result?.net.succeeded ?? false;
  const damage = weapon.damage + Math.max(0, netSuccess);
  const finalDamage = Math.max(0, damage - target.soak);
  const newWounds = target.wounds + finalDamage;
  const exceedsThreshold = newWounds > target.woundThreshold;

  return (
    <Box bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" p={3}>
      <HStack justify="space-between" align="start" mb={2}>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">Weapon</Text>
          <Text fontSize="sm" color="gray.100" fontWeight="semibold">{weapon.name}</Text>
          <Text fontSize="xs" color="gray.500">Dmg {weapon.damage} · Crit {weapon.crit} · {weapon.range}</Text>
        </VStack>
        <VStack align="end" spacing={0}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">Target</Text>
          <Text fontSize="sm" color="gray.100" fontWeight="semibold">{target.name}</Text>
          <Text fontSize="xs" color="gray.500">Soak {target.soak} · {target.wounds}/{target.woundThreshold} wounds</Text>
        </VStack>
      </HStack>

      <HStack mt={2} spacing={3} justify="space-between" align="center">
        <HStack spacing={2} fontSize="sm">
          <Text color="gray.400">{weapon.damage}</Text>
          <Text color="gray.500">+</Text>
          <Text color={succeeded ? 'green.300' : 'gray.500'}>{Math.max(0, netSuccess)}</Text>
          <Text color="gray.500">−</Text>
          <Text color="gray.400">{target.soak}</Text>
          <Text color="gray.500">=</Text>
          <Text fontSize="lg" fontWeight="bold" color={result && succeeded && finalDamage > 0 ? 'red.300' : 'gray.500'}>
            {!result ? '?' : succeeded ? `${finalDamage} wounds` : '— miss'}
          </Text>
        </HStack>
        <Button
          colorScheme="red"
          size="sm"
          isDisabled={!result || !succeeded || finalDamage === 0}
          onClick={() =>
            toast({
              title: 'Apply to target (no-op in prototype)',
              description: `Would apply ${finalDamage} wounds to ${target.name}.`,
              status: 'info',
              duration: 3000,
            })
          }
        >
          Apply to {target.name}
        </Button>
      </HStack>

      {result && succeeded && exceedsThreshold && (
        <Text mt={2} fontSize="xs" color="red.300">
          ⚠ Wounds exceed threshold ({newWounds}/{target.woundThreshold}) — would trigger Critical Injury.
        </Text>
      )}
    </Box>
  );
};

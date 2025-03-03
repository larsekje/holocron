import React from 'react';
import { HStack, IconButton, Progress, Text, Tooltip } from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

interface Props {
  name: string;
  max: number;
  current: number;
  minions?: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

/**
 * Health bar component for showing wounds or strain
 * Special handling for minion groups
 */
const HealthBar = ({ name, max, current, minions, onDecrease, onIncrease }: Props) => {
  // For minion groups, the max health is the wounds threshold times the number of minions
  const maxTotal = minions ? max * minions : max;
  const healthBar = createHealthBar(current, max, minions);

  return (
    <>
      <HStack alignItems="flex-end">
        <Text userSelect="none">{name}</Text>
        <Tooltip hasArrow placement="top" label={`Set ${name}`} openDelay={200}>
          <Text userSelect="none" cursor="pointer" as="b" fontSize="sm">{current}/{maxTotal}</Text>
        </Tooltip>
      </HStack>
      <HStack>
        {healthBar}
        <IconButton size='xs' bg='none' aria-label='decrease' icon={<MinusIcon />} onClick={onDecrease} />
        <IconButton size='xs' bg='none' aria-label='increase' icon={<AddIcon />} onClick={onIncrease} />
      </HStack>
    </>
  );
};

/**
 * Creates the health bar(s) based on the current wounds and wound threshold
 * For minions, creates multiple bars, one for each minion
 */
function createHealthBar(currentWounds: number, woundThreshold: number, minions?: number) {
  const defaultBar = (wounds: number) =>
    <Progress width="100%" colorScheme='red' bg='green.500' value={wounds} max={woundThreshold} borderRadius='5px' />

  if (minions === undefined)
    return defaultBar(currentWounds);

  // Create health bars for each minion in group
  else {
    let bars = [];
    for (let i = 0; i < minions; i++) {
      let woundsRemaining = woundThreshold * minions - currentWounds;
      let cappedWoundsRemaining = Math.max(Math.min(woundsRemaining - (i * woundThreshold), woundThreshold), 0);
      bars.unshift(defaultBar(woundThreshold - cappedWoundsRemaining))
    }

    return (
      <HStack spacing="1" width="100%">
        {bars}
      </HStack>
    );
  }
}

export default HealthBar;

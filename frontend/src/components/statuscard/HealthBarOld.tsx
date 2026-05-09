import React from 'react';
import {HStack, IconButton, Progress, Text} from "@chakra-ui/react";
import {AddIcon, MinusIcon} from "@chakra-ui/icons";
import InlineNumber from "@components/common/InlineNumber";

interface Props {
  name: string;
  // For non-minion: max wounds for this character (= threshold).
  // For minion groups: per-minion threshold (so the bar can split into N bars).
  max: number;
  // Wounds taken (0 = healthy, max = at threshold).
  current: number;
  // Initial minion count if this is a minion group; absent otherwise.
  minions?: number;
  onDecrease: () => void;
  onIncrease: () => void;
  // Called when the user submits a new threshold inline. The value is per-character /
  // per-minion (not the group total).
  onSetThreshold?: (value: number) => void;
}

const HealthBarOld = ({name, max, current, minions, onDecrease, onIncrease, onSetThreshold}: Props) => {
  const maxTotal = minions ? max * minions : max;
  const isMinion = !!minions;
  // Reserve cell width based on digit count so editing doesn't shift other components.
  const cellWidth = String(maxTotal).length >= 2 ? "30px" : "20px";

  return (
    <>
      <HStack alignItems="center" spacing={2}>
        <Text userSelect="none" color="white">{name}</Text>
        {/* current / threshold, flush — no spacing between, fixed-width threshold cell. */}
        <HStack spacing={0} align="center" fontSize="sm" color="whiteAlpha.700">
          <Text as="b">{current}</Text>
          <Text as="b" mx="1px">/</Text>
          {onSetThreshold && !isMinion ? (
            <InlineNumber
              value={max}
              min={1}
              onSave={onSetThreshold}
              fontSize="sm"
              color="whiteAlpha.700"
              cellWidth={cellWidth}
            />
          ) : (
            <Text as="b" minW={cellWidth} textAlign="center">
              {maxTotal}
            </Text>
          )}
        </HStack>
      </HStack>
      <HStack>
        {renderBars(current, max, minions)}
        <IconButton
          size="xs"
          bg="none"
          aria-label={`decrease ${name.toLowerCase()}`}
          icon={<MinusIcon color="white"/>}
          onClick={onDecrease}
        />
        <IconButton
          size="xs"
          bg="none"
          aria-label={`increase ${name.toLowerCase()}`}
          icon={<AddIcon color="white"/>}
          onClick={onIncrease}
        />
      </HStack>
    </>
  );
};

function bar(value: number, max: number, key?: React.Key) {
  return (
    <Progress
      key={key}
      width="100%"
      colorScheme="red"
      bg="green.500"
      value={value}
      max={max}
      borderRadius="5px"
    />
  );
}

function renderBars(current: number, max: number, minions?: number) {
  if (!minions) return bar(current, max);

  const segments: React.ReactNode[] = [];
  for (let i = 0; i < minions; i++) {
    const woundsRemaining = max * minions - current;
    const cappedRemaining = Math.max(Math.min(woundsRemaining - i * max, max), 0);
    segments.unshift(bar(max - cappedRemaining, max, i));
  }
  return (
    <HStack spacing="1" width="100%">
      {segments}
    </HStack>
  );
}

export default HealthBarOld;

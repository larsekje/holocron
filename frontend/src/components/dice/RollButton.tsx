import React from 'react';
import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import type { DicePool } from '@/engine/diceEngine';
import useDiceRollerStore from '@/state/diceRollerStore';
import useParticipantStore from '@/state/participantsStore';

interface RollButtonProps {
  pool: DicePool;
  hasResult: boolean;
}

export const RollButton: React.FC<RollButtonProps> = ({ pool, hasResult }) => {
  const total = Object.values(pool).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const disabled = total === 0;
  const roll = useDiceRollerStore((s) => s.roll);
  const rolling = useDiceRollerStore((s) => s.rolling);
  const passPoolTo = useDiceRollerStore((s) => s.passPoolTo);
  const attackerId = useDiceRollerStore((s) => s.snapshot?.attackerParticipantId);
  const participants = useParticipantStore((s) => s.participants);
  const candidates = participants.filter((p) => p.id !== attackerId);

  return (
    <HStack spacing={2} width="100%">
      <Button
        size="md"
        flex="1"
        colorScheme="orange"
        letterSpacing="0.12em"
        textTransform="uppercase"
        isDisabled={disabled}
        isLoading={rolling}
        loadingText="Rolling…"
        onClick={() => roll()}
      >
        {hasResult ? 'Re-roll' : 'Roll'}
      </Button>
      <Menu placement="top-end" isLazy>
        <Tooltip label="Hand the prepared pool to another character to roll" placement="top" hasArrow openDelay={400}>
          <MenuButton
            as={Button}
            size="md"
            colorScheme="purple"
            variant="outline"
            isDisabled={disabled || candidates.length === 0}
            rightIcon={<ChevronDownIcon />}
          >
            Pass
          </MenuButton>
        </Tooltip>
        <MenuList bg="gray.800" borderColor="gray.700" maxH="240px" overflowY="auto">
          {candidates.length === 0 ? (
            <MenuItem isDisabled bg="gray.800">No other participants</MenuItem>
          ) : (
            candidates.map((p) => (
              <MenuItem
                key={p.id}
                bg="gray.800"
                _hover={{ bg: 'gray.700' }}
                onClick={() => passPoolTo(p.id)}
              >
                <HStack spacing={2} flex="1">
                  <Text fontSize="sm" color="gray.100">{p.name}</Text>
                  {p.isPC && <Tag size="sm" variant="subtle" colorScheme="blue">PC</Tag>}
                </HStack>
              </MenuItem>
            ))
          )}
        </MenuList>
      </Menu>
    </HStack>
  );
};

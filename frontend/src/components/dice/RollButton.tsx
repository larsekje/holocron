import React from 'react';
import { Button } from '@chakra-ui/react';
import type { DicePool } from '@/engine/diceEngine';

interface RollButtonProps {
  pool: DicePool;
  hasResult: boolean;
}

/** Big primary roll button. No-op in the prototype. */
export const RollButton: React.FC<RollButtonProps> = ({ pool, hasResult }) => {
  const total = Object.values(pool).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const disabled = total === 0;
  return (
    <Button
      size="lg"
      colorScheme="purple"
      width="100%"
      isDisabled={disabled}
      onClick={() => undefined}
    >
      {hasResult ? 'Re-roll' : 'Roll'}
    </Button>
  );
};

import React from 'react';
import { Box } from '@chakra-ui/react';

interface Props {
  wounds: number;
  /** Total capacity — for a minion group this is per-minion threshold ×
   *  group size; for a single target it's just the wound threshold. */
  total: number;
  /** Group size. >1 draws per-minion divider lines; omit / 1 = single bar. */
  minions?: number;
}

/**
 * One continuous wound bar: muted green = health, muted red = damage filling
 * from the left. For minion groups it stays a single continuous bar — thin
 * divider lines just mark each minion's slice, so as the red sweeps past a
 * divider that minion is visibly gone.
 *
 * Fills its container (h/w 100%), so the caller controls height + radius.
 * Shared by TargetCardOld and MiniStatCard.
 */
const WoundBar: React.FC<Props> = ({ wounds, total, minions }) => {
  const damagePct = total > 0 ? Math.min(100, Math.max(0, (wounds / total) * 100)) : 0;
  const sections = minions && minions > 1 ? minions : 1;
  return (
    <Box position="relative" h="100%" w="100%" bg="#3a7e57" overflow="hidden">
      {/* Damage — muted red, from the left. */}
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        w={`${damagePct}%`}
        bg="#7a3838"
        transition="width 0.15s ease"
      />
      {/* Per-minion divider lines (groups only). */}
      {sections > 1 &&
        Array.from({ length: sections - 1 }).map((_, i) => (
          <Box
            key={i}
            position="absolute"
            top={0}
            bottom={0}
            left={`${((i + 1) / sections) * 100}%`}
            w="1px"
            bg="#1a1d21"
          />
        ))}
    </Box>
  );
};

export default WoundBar;

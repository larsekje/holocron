import React from 'react';
import { Box } from '@chakra-ui/react';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';
import type { Tier } from './rosterVisuals';

/**
 * Tier → narrative-die glyph (Minion=Setback, Rival=Difficulty,
 * Nemesis=Challenge), matching the target cards' TierIcon and the roster rows.
 * Sat on a subtle plate so the near-black Setback die stays visible on the
 * dark panel.
 */
const TierDie: React.FC<{ tier: Tier; size?: number }> = ({ tier, size = 14 }) => {
  const Svg = tier === 'Nemesis' ? ChallengeSvg : tier === 'Rival' ? DifficultySvg : SetbackSvg;
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      bg="whiteAlpha.100"
      borderRadius="sm"
      p="1px"
      flexShrink={0}
    >
      <Svg width={size} height={size} />
    </Box>
  );
};

export default TierDie;

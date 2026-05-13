import React from 'react';
import { Box, Kbd } from '@chakra-ui/react';
import { useHelpOverlayStore } from '@/state/helpOverlayStore';

// Renders a small Kbd chip in the top-right corner of its parent, but only
// while the GM is holding `?`. Parent must have position: relative so the
// chip anchors to the button's edge.
const HotkeyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const visible = useHelpOverlayStore((s) => s.visible);
  if (!visible) return null;
  return (
    <Box
      position="absolute"
      top="-7px"
      right="-7px"
      zIndex={2}
      pointerEvents="none"
    >
      <Kbd
        bg="gray.700"
        color="gray.100"
        borderColor="whiteAlpha.300"
        fontSize="2xs"
        px="5px"
        py="0"
      >
        {children}
      </Kbd>
    </Box>
  );
};

export default HotkeyHint;

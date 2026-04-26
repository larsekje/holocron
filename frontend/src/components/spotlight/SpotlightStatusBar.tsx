import React from 'react';
import { Box, HStack, Kbd, Text } from '@chakra-ui/react';

const Hint: React.FC<{ keys: string[]; label: string }> = ({ keys, label }) => (
  <HStack spacing={1}>
    {keys.map((k, i) => (
      <Kbd key={i} fontSize="xs" px={1.5} py={0} borderColor="gray.600" color="gray.300">
        {k}
      </Kbd>
    ))}
    <Text fontSize="xs" color="gray.500">
      {label}
    </Text>
  </HStack>
);

const SpotlightStatusBar: React.FC = () => {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const cmd = isMac ? '⌘' : 'Ctrl';

  return (
    <Box
      px={4}
      py={1.5}
      bg="#1f2226"
      borderTop="1px solid"
      borderColor="gray.700"
      flexShrink={0}
    >
      <HStack spacing={4} flexWrap="wrap">
        <Hint keys={['↑', '↓']} label="navigate" />
        <Hint keys={['↵']} label="open" />
        <Hint keys={[cmd, 'K']} label="toggle" />
        <Hint keys={['esc']} label="close" />
      </HStack>
    </Box>
  );
};

export default SpotlightStatusBar;

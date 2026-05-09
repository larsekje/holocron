import React from 'react';
import { Box, Button, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { type ModalSnapshot, SNAPSHOTS_BY_MODE } from '@components/dice/mockSnapshots';

interface DiceRollerDebugLauncherProps {
  onOpen: (snapshot: ModalSnapshot) => void;
}

const MODE_HEADERS: { key: keyof typeof SNAPSHOTS_BY_MODE; label: string }[] = [
  { key: 'basic', label: 'Basic' },
  { key: 'opposed', label: 'Opposed' },
  { key: 'combat', label: 'Combat' },
  { key: 'skillChallenge', label: 'Skill Challenge' },
];

export const DiceRollerDebugLauncher: React.FC<DiceRollerDebugLauncherProps> = ({ onOpen }) => {
  return (
    <Box
      bg="gray.900"
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.700"
      p={3}
      mt={3}
    >
      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" mb={2}>
        Dice Roller (debug)
      </Text>

    </Box>
  );
};

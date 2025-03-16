import React from 'react';
import { Box, Flex, Text, Badge, Tooltip, SimpleGrid, Image } from '@chakra-ui/react';
import { DicePouch as DicePouchType, Participant } from '@/state/participantsStore';

interface DicePouchProps {
  participant: Participant;
  participantId: string;
}

/**
 * Component to display dice modifications for a participant
 */
const DicePouch: React.FC<DicePouchProps> = ({ participant }) => {
  const dicePouch = participant.dicePouch;
  
  // If no dice pouch or no modifications, don't render
  if (!dicePouch) {
    return null;
  }
  
  // Helper function to check if dice pouch has any modifications
  const hasModifications = Object.values(dicePouch).some(value => value !== 0);
  
  if (!hasModifications) {
    return null;
  }
  
  // Get dice image paths
  const getDiceImagePath = (diceType: string) => {
    return `/assets/images/dice/${diceType.toLowerCase()}.png`;
  };
  
  // Define dice colors for badges
  const diceColors: Record<keyof DicePouchType, string> = {
    boost: 'blue',
    setback: 'blackAlpha',
    advantage: 'green',
    threat: 'purple',
    success: 'yellow',
    failure: 'red',
    triumph: 'yellow',
    despair: 'red',
    force: 'white'
  };
  
  // Display names for dice
  const diceDisplayNames: Record<keyof DicePouchType, string> = {
    boost: 'Boost',
    setback: 'Setback',
    advantage: 'Advantage',
    threat: 'Threat',
    success: 'Success',
    failure: 'Failure',
    triumph: 'Triumph',
    despair: 'Despair',
    force: 'Force'
  };
  
  // Get dice entries with non-zero values
  const activeDice = Object.entries(dicePouch).filter(
    ([_, value]) => value !== 0
  ) as [keyof DicePouchType, number][];
  
  return (
    <Box mt={2} p={2} borderWidth="1px" borderRadius="md">
      <Text fontSize="sm" fontWeight="bold" mb={1}>
        Dice Modifications
      </Text>
      <SimpleGrid columns={[2, 3, 4]} spacing={2}>
        {activeDice.map(([diceType, amount]) => (
          <Tooltip key={diceType} label={`${amount > 0 ? '+' : ''}${amount} ${diceDisplayNames[diceType]}`}>
            <Flex 
              align="center" 
              p={1} 
              borderRadius="md"
            >
              <Image 
                src={getDiceImagePath(diceType)} 
                alt={diceType}
                boxSize="20px"
                mr={1}
                fallback={
                  <Box 
                    w="20px" 
                    h="20px" 
                    borderRadius="md" 
                    bg={diceColors[diceType]}
                  />
                }
              />
              <Badge 
                colorScheme={amount > 0 ? 'green' : 'red'}
                variant="subtle"
              >
                {amount > 0 ? `+${amount}` : amount}
              </Badge>
            </Flex>
          </Tooltip>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default DicePouch;

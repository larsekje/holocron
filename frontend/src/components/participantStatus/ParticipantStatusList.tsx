import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  Button, 
  Flex, 
  HStack, 
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Portal
} from '@chakra-ui/react';
import { AddIcon, QuestionIcon, ChevronDownIcon } from '@chakra-ui/icons';
import useParticipantStore from '@/state/participantsStore';
import ParticipantStatus from './ParticipantStatus';
import AdversarySelector from '@/components/adversaries/AdversarySelector';
import adversaryService from '@/services/adversaryService';

type AdversaryType = 'Minion' | 'Rival' | 'Nemesis' | undefined;

/**
 * Component to display a list of participants with their status
 */
const ParticipantStatusList = () => {
  const { participants, addParticipant } = useParticipantStore();
  const [isAdversarySelectorOpen, setIsAdversarySelectorOpen] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const toast = useToast();

  // Add a random adversary to the participant list
  const handleAddRandomAdversary = async (type?: AdversaryType) => {
    setIsLoadingRandom(true);
    
    try {
      // Get a random adversary, filtered by type if specified
      const randomAdversary = await adversaryService.getRandomAdversary(type);
      
      if (!randomAdversary) {
        toast({
          title: 'No adversaries available',
          description: type ? `Could not find any ${type} adversaries` : 'Could not find any adversaries to add',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Convert adversary to participant
      const newParticipant = adversaryService.convertToParticipant(randomAdversary);
      
      // Add the participant
      addParticipant(newParticipant);
      
      toast({
        title: 'Random adversary added',
        description: `${randomAdversary.name} (${randomAdversary.type}) has been added as a participant`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding random adversary:', error);
      toast({
        title: 'Error adding random adversary',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingRandom(false);
    }
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Targets</Heading>
        <HStack spacing={2}>
          {/* Random adversary dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              colorScheme="purple"
              leftIcon={<QuestionIcon />}
              rightIcon={<ChevronDownIcon />}
              isLoading={isLoadingRandom}
              loadingText="Adding..."
            >
              Random
            </MenuButton>
            <Portal>
              <MenuList zIndex={1500}>
                <MenuItem onClick={() => handleAddRandomAdversary()}>
                  Any Type
                </MenuItem>
                <MenuItem onClick={() => handleAddRandomAdversary('Minion')}>
                  Minion
                </MenuItem>
                <MenuItem onClick={() => handleAddRandomAdversary('Rival')}>
                  Rival
                </MenuItem>
                <MenuItem onClick={() => handleAddRandomAdversary('Nemesis')}>
                  Nemesis
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>

          <Button 
            size="sm" 
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={() => setIsAdversarySelectorOpen(true)}
          >
            Add Adversary
          </Button>
        </HStack>
      </Flex>
      
      {participants.length === 0 ? (
        <Text>No active targets</Text>
      ) : (
        <VStack spacing={2} align="stretch">
          {participants.map(participant => (
            <ParticipantStatus 
              key={participant.id}
              participant={participant}
              participantId={participant.id}
            />
          ))}
        </VStack>
      )}

      {/* Adversary Selector Modal */}
      <AdversarySelector 
        isOpen={isAdversarySelectorOpen} 
        onClose={() => setIsAdversarySelectorOpen(false)} 
      />
    </Box>
  );
};

export default ParticipantStatusList;

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Spinner,
  useToast,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { AddIcon, QuestionIcon, ChevronDownIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaSkull, FaUserNinja, FaUserTie } from 'react-icons/fa';
import useParticipantStore from '@/state/participantsStore';
import ParticipantStatus from './participantStatus/ParticipantStatus';
import AdversarySelector from './adversaries/AdversarySelector';
import adversaryService from '@/services/adversaryService';
import ContentCard from './ContentCard';

type AdversaryType = 'Minion' | 'Rival' | 'Nemesis' | undefined;

/**
 * Component to display a list of participants with their status
 * This component is designed to work in both structured and non-structured modes
 */
const ContentCardTargets: React.FC = () => {
  const { participants, addParticipant } = useParticipantStore();
  const [isAdversarySelectorOpen, setIsAdversarySelectorOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<AdversaryType | 'any' | null>(null);
  const toast = useToast();

  // Add a random adversary to the participant list
  const handleAddRandomAdversary = async (type?: AdversaryType) => {
    const loadKey = type || 'any';
    setLoadingType(loadKey);

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
      setLoadingType(null);
    }
  };

  // Menu buttons for the ContentCard header
  const cardButtons = (
    <>
      <HStack spacing={2}>
        <Tooltip label="Add Minion">
          <IconButton
            aria-label="Add Minion adversary"
            icon={<FaSkull />}
            size="sm"
            colorScheme="green"
            variant="ghost"
            isLoading={loadingType === 'Minion'}
            onClick={() => handleAddRandomAdversary('Minion')}
          />
        </Tooltip>
        <Tooltip label="Add Rival">
          <IconButton
            aria-label="Add Rival adversary"
            icon={<FaUserNinja />}
            size="sm"
            colorScheme="orange"
            variant="ghost"
            isLoading={loadingType === 'Rival'}
            onClick={() => handleAddRandomAdversary('Rival')}
          />
        </Tooltip>
        <Tooltip label="Add Nemesis">
          <IconButton
            aria-label="Add Nemesis adversary"
            icon={<FaUserTie />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            isLoading={loadingType === 'Nemesis'}
            onClick={() => handleAddRandomAdversary('Nemesis')}
          />
        </Tooltip>
        <Tooltip label="Add specific adversary">
          <IconButton
            aria-label="Add specific adversary"
            icon={<AddIcon />}
            size="sm"
            colorScheme="blue"
            variant="ghost"
            onClick={() => setIsAdversarySelectorOpen(true)}
            isDisabled={loadingType !== null}
          />
        </Tooltip>
      </HStack>
    </>
  );

  return (
    <ContentCard 
      heading="Targets" 
      buttons={cardButtons}
      icon={<RepeatIcon />}
    >
      {participants.length === 0 ? (
        <Text color="gray.400">No active targets</Text>
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
    </ContentCard>
  );
};

export default ContentCardTargets;

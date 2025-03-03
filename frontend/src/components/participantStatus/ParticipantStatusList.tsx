import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import useParticipantStore from '@/state/participantsStore';
import ParticipantStatus from './ParticipantStatus';

/**
 * Component to display a list of participants with their status
 */
const ParticipantStatusList = () => {
  const { participants } = useParticipantStore();

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>Targets</Heading>
      
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
    </Box>
  );
};

export default ParticipantStatusList;

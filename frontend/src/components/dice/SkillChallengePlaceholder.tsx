import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

export const SkillChallengePlaceholder: React.FC = () => (
  <Box
    bg="gray.800"
    borderRadius="md"
    borderWidth="1px"
    borderStyle="dashed"
    borderColor="gray.600"
    p={8}
    textAlign="center"
  >
    <VStack spacing={2}>
      <Text fontSize="lg" color="gray.300" fontWeight="semibold">
        Skill Challenges
      </Text>
      <Text fontSize="sm" color="gray.500">
        Coming soon. Skill challenges are a multi-roll structure for extended scenes
        (chases, slicing through layered security, marathon negotiations).
      </Text>
    </VStack>
  </Box>
);

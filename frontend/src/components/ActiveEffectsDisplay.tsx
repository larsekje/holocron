import React from 'react';
import { useEffectStore } from '@/state/effectStore';
import useParticipantStore from "@/state/participantsStore";
import { ActiveEffect } from '@/types/effectTypes';
import {
    Box,
    VStack,
    HStack,
    Button,
    Text,
    Heading,
    Card,
    CardBody,
    Badge,
} from '@chakra-ui/react';

const ActiveEffectsDisplay: React.FC = () => {
    const { effects, removeEffect } = useEffectStore();
    const { participants } = useParticipantStore();

    if (effects.length === 0) {
        return (
            <Box p={4}>
                <Text color="gray.300">No active effects</Text>
            </Box>
        );
    }

    return (
        <Box p={4}>
            <Heading size="md" mb={4} color="white">Active Effects ({effects.length})</Heading>
            <VStack spacing={3}>
                {effects.map((effect) => (
                    <Card key={effect.effect.id} width="full">
                        <CardBody>
                            <VStack align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                    <Heading size="sm" color="gray.700">
                                        {effect.effect.name}
                                    </Heading>
                                    <Button
                                        colorScheme="red"
                                        size="sm"
                                        onClick={() => removeEffect(effect.effect.id)}
                                    >
                                        Remove
                                    </Button>
                                </HStack>

                                {/* Effect Details */}
                                <Box>
                                    {effect.effect.description && (
                                        <Text fontSize="sm" color="gray.400" mb={2}>
                                            {effect.effect.description}
                                        </Text>
                                    )}
                                    
                                    <HStack wrap="wrap" spacing={2} mb={2}>
                                        <Badge colorScheme="purple">
                                            {effect.target.type}
                                            {effect.target.type === 'character' && 
                                                ` (${participants.find(p => p.id === effect.target.characterId)?.name ?? 'Unknown'})`}
                                        </Badge>
                                        <Badge colorScheme="blue">
                                            {effect.effect.type}
                                        </Badge>
                                        <Badge colorScheme="cyan">
                                            {effect.effect.behavior.type}
                                        </Badge>
                                        <Badge colorScheme="orange">
                                            Trigger: {effect.effect.behavior.trigger}
                                        </Badge>
                                    </HStack>

                                    {/* Duration and Timing Info */}
                                    <HStack spacing={4} fontSize="sm" color="gray.400">
                                        <Text>
                                            Duration: {effect.remainingDuration === null ? 
                                                'Indefinite' : 
                                                `${effect.remainingDuration} turns remaining`
                                            }
                                        </Text>
                                        <Text>
                                            Applied: {new Date(effect.appliedAt).toLocaleTimeString()}
                                        </Text>
                                    </HStack>

                                    {/* Target Details */}
                                    <Box mt={2} fontSize="sm">
                                        <Text fontWeight="medium" color="gray.600">
                                            Target Details:
                                        </Text>
                                        {effect.target.type === 'character' && (
                                            <Text color="gray.400">
                                                Character: {participants.find(p => p.id === effect.target.characterId)?.name ?? 'Unknown'}
                                                {' '}
                                                ({participants.find(p => p.id === effect.target.characterId)?.isPC ? 'PC' : 'NPC'})
                                            </Text>
                                        )}
                                        {effect.target.type === 'initiative' && (
                                            <Text color="gray.400">
                                                Initiative Position: {effect.target.initiativePosition}
                                            </Text>
                                        )}
                                        {effect.target.type === 'global' && (
                                            <Text color="gray.400">
                                                Affects: All participants
                                            </Text>
                                        )}
                                    </Box>

                                    {/* Effect Type Specific Info */}
                                    <Box mt={2} fontSize="sm">
                                        <Text fontWeight="medium" color="gray.600">
                                            Effect Type:
                                        </Text>
                                        <Text color="gray.400">
                                            {effect.effect.type === 'buff' && '🔼 Positive effect that enhances abilities'}
                                            {effect.effect.type === 'debuff' && '🔽 Negative effect that hinders abilities'}
                                            {effect.effect.type === 'persistence' && '⏳ Ongoing effect that persists'}
                                        </Text>
                                    </Box>
                                </Box>
                            </VStack>
                        </CardBody>
                    </Card>
                ))}
            </VStack>
        </Box>
    );
};

export default ActiveEffectsDisplay;

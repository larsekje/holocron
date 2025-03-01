import React from 'react';
import { useEffectStore } from '@/state/effectStore';
import useParticipantStore from "@/state/participantsStore";
import { Effect, EffectTarget } from '@/types/effectTypes';
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

interface ParticipantEffect {
    id: string;
    effect: Effect;
    target: EffectTarget;
}

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
                {effects.map((effect: ParticipantEffect) => (
                    <Card key={effect.id} width="full">
                        <CardBody>
                            <VStack align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                    <Heading size="sm" color="gray.700">
                                        {effect.effect.name}
                                    </Heading>
                                    <Button
                                        colorScheme="red"
                                        size="sm"
                                        onClick={() => removeEffect(effect.id)}
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
                                                ` (${participants.find(p => p.id === effect.target.participantId)?.name ?? 'Unknown'})`}
                                        </Badge>
                                        <Badge colorScheme="blue">
                                            {effect.effect.behavior.trigger}
                                        </Badge>
                                    </HStack>
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

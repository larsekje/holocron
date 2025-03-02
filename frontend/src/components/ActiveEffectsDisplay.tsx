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
    Flex,
    Spacer,
    Tag,
    TagLabel,
    TagLeftIcon,
    Stack,
} from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

interface ParticipantEffect {
    id: string;
    effect: Effect;
    target: EffectTarget;
    remainingDuration?: number;
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

    // Helper function to determine the tag color based on remaining duration
    const getDurationTagColor = (remaining?: number): string => {
        if (remaining === undefined) return 'gray';
        if (remaining <= 1) return 'red';
        if (remaining <= 2) return 'orange';
        return 'green';
    };

    return (
        <Box p={4}>
            <Heading size="md" mb={4} color="white">Active Effects ({effects.length})</Heading>
            <VStack spacing={3}>
                {effects.map((effect: ParticipantEffect) => (
                    <Card key={effect.id} width="full">
                        <CardBody>
                            <VStack align="stretch" spacing={2}>
                                {/* Header with effect name and remove button */}
                                <Flex justify="space-between" align="center">
                                    <VStack align="start" spacing={1}>
                                        <Heading size="sm" color="gray.700">
                                            {effect.effect.name}
                                        </Heading>
                                        
                                        {/* Duration display */}
                                        {effect.remainingDuration !== undefined && (
                                            <Tag 
                                                size="sm" 
                                                colorScheme={getDurationTagColor(effect.remainingDuration)}
                                                variant="subtle"
                                            >
                                                <TagLeftIcon boxSize="0.8em" as={TimeIcon} />
                                                <TagLabel>
                                                    {effect.remainingDuration} {effect.remainingDuration === 1 ? 'round' : 'rounds'}
                                                </TagLabel>
                                            </Tag>
                                        )}
                                    </VStack>
                                    
                                    <Button
                                        colorScheme="red"
                                        size="sm"
                                        onClick={() => removeEffect(effect.id)}
                                    >
                                        Remove
                                    </Button>
                                </Flex>

                                {/* Effect Details */}
                                <Box>
                                    {effect.effect.description && (
                                        <Text fontSize="sm" color="gray.400" mb={2}>
                                            {effect.effect.description}
                                        </Text>
                                    )}
                                    
                                    {/* Target information */}
                                    <HStack spacing={2} flexWrap="wrap">
                                        <Badge colorScheme={effect.effect.type === 'debuff' ? 'red' : 'blue'}>
                                            {effect.effect.type || 'Effect'}
                                        </Badge>
                                        <Badge colorScheme="purple">
                                            {effect.effect.behavior.trigger}
                                        </Badge>
                                        {effect.target.type === 'character' && effect.target.participantId && (
                                            <Badge colorScheme="teal">
                                                Target: {participants.find(p => p.id === effect.target.participantId)?.name || 'Unknown'}
                                            </Badge>
                                        )}
                                        {effect.target.type === 'global' && (
                                            <Badge colorScheme="teal">
                                                Global
                                            </Badge>
                                        )}
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

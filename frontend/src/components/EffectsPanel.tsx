import React, { useState, useEffect } from 'react';
import { useEffectStore } from '@/state/effectStore';
import useParticipantStore from "@/state/participantsStore"
import { Effect, EffectTarget } from '@/types/effectTypes';
import {
    Box,
    VStack,
    HStack,
    Input,
    Select,
    Button,
    Text,
    Heading,
    Card,
    CardBody,
    Badge,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tooltip,
    useToast,
    Textarea,
    Divider
} from '@chakra-ui/react';
import ActiveEffectsDisplay from "@components/ActiveEffectsDisplay";

// Define the effect types
type EffectType = 'custom' | 'staggered';

const EffectsPanel: React.FC = () => {
    const { effects, addEffect, removeEffect, decrementEffectDuration } = useEffectStore();
    const { participants } = useParticipantStore();
    const [targetType, setTargetType] = useState<EffectTarget['type']>('character');
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
    const [staggeredParticipantId, setStaggeredParticipantId] = useState<string>('');
    const [triggerType, setTriggerType] = useState<'turn-start' | 'turn-end'>('turn-start');
    const [duration, setDuration] = useState<number>(1); // Add state for duration
    const toast = useToast();

    // Set default participant when participants list changes
    useEffect(() => {
        if (participants.length > 0) {
            if (!selectedParticipantId) {
                setSelectedParticipantId(participants[0].id);
            }
            if (!staggeredParticipantId) {
                setStaggeredParticipantId(participants[0].id);
            }
        }
    }, [participants]);

    const handleAddEffect = () => {
        // Configure the target
        const target: EffectTarget = {
            type: targetType
        };

        // For character effects, set the participantId
        if (targetType === 'character') {
            target.participantId = selectedParticipantId;
        }
        
        const targetParticipantName = targetType === 'character' 
            ? participants.find(p => p.id === selectedParticipantId)?.name || 'Unknown'
            : '';
            
        // Configure the effect
        const effectName = targetType === 'character' 
            ? `Effect on ${targetParticipantName}`
            : `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} Effect`;
        const effectDescription = `Triggers on ${triggerType}${duration > 0 ? ` (${duration} rounds)` : ''}`;
            
        const effect: Effect = {
            id: Math.random().toString(36).substring(7), // Generate a unique ID
            name: effectName,
            description: effectDescription,
            target: target, // Include target in the effect object
            behavior: {
                type: 'active', // The effect is active by default
                trigger: triggerType
            },
            duration: duration, // Set duration from state
            type: 'buff', // Default to buff type
            apply: (participant, durationMessage = '') => {
                let targetDesc = '';
                if (target.type === 'character' && participant) {
                    targetDesc = ` on ${participant.name}`;
                }
                
                toast({
                    title: effectName,
                    description: `${effectDescription}${targetDesc}${durationMessage}`,
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                });
            },
        };

        addEffect(effect, target);
        toast({
            title: 'Effect Added',
            description: `Added ${targetType} effect${duration > 0 ? ` (${duration} rounds)` : ''}`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const handleAddStaggeredEffect = () => {
        if (!staggeredParticipantId) return;
        
        const target: EffectTarget = {
            type: 'character',
            participantId: staggeredParticipantId
        };
        
        // Get the participant name
        const targetParticipantName = participants.find(p => p.id === staggeredParticipantId)?.name || 'Unknown';
        
        const effect: Effect = {
            id: Math.random().toString(36).substring(7), // Generate a unique ID
            name: `STAGGERED: ${targetParticipantName}`,
            description: 'Cannot perform actions until end of next turn',
            target: target, // Include target in the effect object
            behavior: {
                type: 'active', // The effect is active
                trigger: 'turn-start'  // Always trigger at turn start for staggered
            },
            duration: 2, // Set duration to 2 rounds
            type: 'debuff',
            apply: (participant, durationMessage = '') => {
                toast({
                    title: `STAGGERED: ${participant?.name || targetParticipantName}`,
                    description: `Cannot perform actions until end of next turn${durationMessage}`,
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            },
        };

        addEffect(effect, target);
        toast({
            title: 'Effect Added',
            description: `Added STAGGERED effect to ${targetParticipantName} (3 rounds)`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const getTargetFromForm = (): EffectTarget => {
        switch (targetType) {
            case 'character':
                return {
                    type: 'character',
                    participantId: selectedParticipantId
                };
            case 'initiative':
                return {
                    type: 'initiative',
                    slot: 1 // TODO: Add initiative slot selection
                };
            case 'global':
                return {
                    type: 'global'
                };
            default:
                return {
                    type: 'global'
                };
        }
    };

    return (
        <Box p={4} bg="gray.800" borderRadius="lg">
            <VStack spacing={6} align="stretch">
                <Heading size="md" color="white">Effects Manager</Heading>
                
                {/* Staggered Effect Card */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <Heading size="sm">STAGGERED</Heading>
                            <Text fontSize="sm" color="gray.600">Cannot perform actions until end of next turn (Duration: 3 rounds)</Text>
                            
                            <Select
                                value={staggeredParticipantId}
                                onChange={(e) => setStaggeredParticipantId(e.target.value)}
                                placeholder="Select target"
                                isDisabled={participants.length === 0}
                            >
                                {participants.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </Select>

                            <Button
                                colorScheme="red"
                                onClick={handleAddStaggeredEffect}
                                isDisabled={!staggeredParticipantId}
                                width="full"
                            >
                                Add STAGGERED
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>
                
                <Divider />

                <ActiveEffectsDisplay/>
                
                {/* Debug Controls */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <Heading size="sm" color="gray.700">Debug Controls</Heading>
                            
                            <Tooltip label="Reduce the duration of all effects by 1">
                                <Button
                                    onClick={() => {
                                        // Get all effects
                                        const allEffects = effects;
                                        
                                        // Loop through all active effects
                                        allEffects.forEach(effect => {
                                            // Apply manual decrement for debugging purposes
                                            if (effect.remainingDuration && effect.remainingDuration > 0) {
                                                // For debugging, directly decrement all durations
                                                decrementEffectDuration(effect.id);
                                                
                                                // Also apply the effect to show updated duration in toast
                                                if (effect.effect.apply) {
                                                    const participant = effect.target.type === 'character' && effect.target.participantId ?
                                                        participants.find(p => p.id === effect.target.participantId) : undefined;
                                                    
                                                    const durationMessage = effect.remainingDuration && effect.remainingDuration > 0 ? 
                                                        ` (${effect.remainingDuration - 1} rounds remaining)` : 
                                                        ' (expiring)';
                                                    
                                                    effect.effect.apply(participant, durationMessage);
                                                }
                                            }
                                        });
                                        
                                        toast({
                                            title: 'Durations Reduced',
                                            description: 'Manually reduced all effect durations by 1',
                                            status: 'info',
                                            duration: 2000,
                                            isClosable: true,
                                        });
                                    }}
                                    width="full"
                                    colorScheme="blue"
                                >
                                    Reduce All Durations
                                </Button>
                            </Tooltip>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    );
};

export default EffectsPanel;

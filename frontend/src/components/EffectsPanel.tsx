import React, { useState } from 'react';
import { useEffectStore } from '@/state/effectStore';
import useParticipantStore from "@/state/participantsStore"
import {ActiveEffect, EffectTarget, EffectBehavior, Effect} from '@/types/effectTypes';
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
    Textarea
} from '@chakra-ui/react';

const EffectsPanel: React.FC = () => {
    const { effects, addEffect, removeEffect, triggerEffects, reduceDuration } = useEffectStore();
    const { participants } = useParticipantStore();
    const [newEffectName, setNewEffectName] = useState('');
    const [newEffectDescription, setNewEffectDescription] = useState('');
    const [targetType, setTargetType] = useState<EffectTarget['type']>('character');
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
    const [selectedParticipantForTrigger, setSelectedParticipantForTrigger] = useState<string>('');
    const [duration, setDuration] = useState<number>(3);
    const toast = useToast();

    const handleAddEffect = () => {
        const newEffect: ActiveEffect = {
            effect: {
                id: `effect-${Date.now()}`,
                name: newEffectName,
                description: newEffectDescription,
                type: 'reminder',
                duration: duration,
                target: getTargetFromForm(),
                behavior: {
                    type: 'reminder',
                    trigger: 'turn-start'
                },
                apply: () => {
                    const target = getTargetFromForm();
                    let targetDesc = '';
                    if (target.type === 'character') {
                        const participant = participants.find(p => p.id === target.participantId);
                        targetDesc = participant ? ` on ${participant.name}` : '';
                    }
                    
                    toast({
                        title: newEffectName,
                        description: newEffectDescription || `Effect triggered${targetDesc}`,
                        status: 'info',
                        duration: 5000,
                        isClosable: true,
                    });
                },
            },
            remainingDuration: duration,
            target: getTargetFromForm(),
            appliedAt: Date.now()
        };

        addEffect(newEffect);
        setNewEffectName('');
        setNewEffectDescription('');
        toast({
            title: 'Effect Added',
            description: `Added effect: ${newEffectName}`,
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
                
                {/* Add Effect Form */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <Input
                                value={newEffectName}
                                onChange={(e) => setNewEffectName(e.target.value)}
                                placeholder="Effect Name"
                            />
                            
                            <Textarea
                                value={newEffectDescription}
                                onChange={(e) => setNewEffectDescription(e.target.value)}
                                placeholder="Effect Description (optional)"
                            />

                            <Select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value as EffectTarget['type'])}
                            >
                                <option value="character">Character</option>
                                <option value="initiative">Initiative Slot</option>
                                <option value="global">Global</option>
                            </Select>

                            {targetType === 'character' && (
                                <Select
                                    value={selectedParticipantId}
                                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                                    placeholder="Select target"
                                >
                                    {participants.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </Select>
                            )}

                            <NumberInput
                                value={duration}
                                onChange={(_, value) => setDuration(value)}
                                min={1}
                            >
                                <NumberInputField placeholder="Duration (rounds)" />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>

                            <Button
                                colorScheme="blue"
                                onClick={handleAddEffect}
                                isDisabled={!newEffectName}
                                width="full"
                            >
                                Add Effect
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Debug Controls */}
                <Card>
                    <CardBody>
                        <VStack spacing={4}>
                            <Heading size="sm" color="gray.700">Debug Controls</Heading>
                            
                            <Tooltip label="Reduce the duration of all effects by 1">
                                <Button
                                    onClick={() => {
                                        reduceDuration();
                                        toast({
                                            title: 'Durations Reduced',
                                            description: 'Reduced all effect durations by 1',
                                            status: 'info',
                                            duration: 2000,
                                            isClosable: true,
                                        });
                                    }}
                                    width="full"
                                >
                                    Reduce Durations
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

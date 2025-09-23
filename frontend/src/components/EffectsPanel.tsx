import React, { useState, useEffect } from 'react';
import { useEffectStore } from '@/state/effectStore';
import useParticipantStore from "@/state/participantsStore"
import { Effect, EffectTarget, StatusFactories } from '@/types/effectTypes';
import {
    Box,
    VStack,
    HStack,
    Select,
    Button,
    Text,
    Heading,
    Card,
    CardBody,
    Badge,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tooltip,
    useToast,
    Divider,
    SimpleGrid,
} from '@chakra-ui/react';
import ActiveEffectsDisplay from "@components/ActiveEffectsDisplay";
import { nanoid } from 'nanoid';
import { emitGameEvent } from '@/state/eventSystem';
import ContentCard from "./ContentCard";
import Spotlight from '@/components/Spotlight';
import { useSpotlightStore } from '@/state/spotlightStore';

const EffectsPanel: React.FC = () => {
    const { effects, addEffect, decrementEffectDuration } = useEffectStore();
    const { participants } = useParticipantStore();

    const toast = useToast();
    const { open: openSpotlight } = useSpotlightStore();

    // Shared target selection
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
    useEffect(() => {
        if (participants.length > 0 && !selectedParticipantId) {
            setSelectedParticipantId(participants[0].id);
        }
    }, [participants]);

    // Disoriented controls
    const [disRank, setDisRank] = useState<number>(1);
    const [disDuration, setDisDuration] = useState<number>(1);

    // Immobilized controls
    const [immDuration, setImmDuration] = useState<number>(1);

    // Ensnared controls
    const [ensRank, setEnsRank] = useState<number>(1);
    const [ensDuration, setEnsDuration] = useState<number | undefined>(undefined);

    // Burn controls
    const [burnRank, setBurnRank] = useState<number>(1);
    const [burnDuration, setBurnDuration] = useState<number | undefined>(undefined);

    const participantOptions = (
        <Select
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
            placeholder="Select target"
            isDisabled={participants.length === 0}
        >
            {participants.map(p => (
                <option key={p.id} value={p.id}>
                    {p.name}
                </option>
            ))}
        </Select>
    );

    const withTarget = (pid: string): EffectTarget => ({
        type: 'character',
        participantId: pid,
    });

    const successToast = (msg: string) => toast({
        title: 'Effect Added',
        description: msg,
        status: 'success',
        duration: 2000,
        isClosable: true,
    });

    // Helper: resolve participant by id
    const findParticipantName = (pid?: string) =>
        participants.find(p => p.id === pid)?.name || 'Unknown';

    // Add STAGGERED
    const handleAddStaggered = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        const eff = StatusFactories.staggered(nanoid(), target, 2);
        const effect: Effect = {
            ...eff,
            apply: (participant, durationMessage = '') => {
                toast({
                    title: `STAGGERED: ${participant?.name || targetName}`,
                    description: `Cannot perform actions until end of next turn${durationMessage}`,
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added STAGGERED to ${targetName} (2 rounds)`);
    };

    // Add PRONE (indefinite)
    const handleAddProne = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        const eff = StatusFactories.prone(nanoid(), target);
        const effect: Effect = {
            ...eff,
            apply: (participant) => {
                toast({
                    title: `PRONE: ${participant?.name || targetName}`,
                    description: `Stand up with a maneuver; melee/ranged modifiers apply.`,
                    status: 'info',
                    duration: 4000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added PRONE to ${targetName} (until they stand)`);
    };

    // Add DISORIENTED X for N rounds
    const handleAddDisoriented = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        const eff = StatusFactories.disoriented(nanoid(), target, disRank, disDuration);
        const effect: Effect = {
            ...eff,
            apply: (participant, durationMessage = '') => {
                toast({
                    title: `DISORIENTED ${eff.rank}: ${participant?.name || targetName}`,
                    description: `Add ${eff.rank} Setback to all checks${durationMessage ? ` ${durationMessage}` : ''}`,
                    status: 'warning',
                    duration: 4000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added DISORIENTED ${eff.rank} to ${targetName} (${disDuration} rounds)`);
    };

    // Add IMMOBILIZED for N rounds
    const handleAddImmobilized = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        const eff = StatusFactories.immobilized(nanoid(), target, immDuration);
        const effect: Effect = {
            ...eff,
            apply: (participant, durationMessage = '') => {
                toast({
                    title: `IMMOBILIZED: ${participant?.name || targetName}`,
                    description: `Cannot perform maneuvers${durationMessage ? ` ${durationMessage}` : ''}`,
                    status: 'warning',
                    duration: 4000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added IMMOBILIZED to ${targetName} (${immDuration} rounds)`);
    };

    // Add ENSNARED X (duration defaults to rank if not set)
    const handleAddEnsnared = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        const eff = StatusFactories.ensnared(nanoid(), target, ensRank, ensDuration);
        const displayDuration = eff.duration ?? ensRank;
        const effect: Effect = {
            ...eff,
            apply: (participant, durationMessage = '') => {
                toast({
                    title: `ENSNARED ${eff.rank}: ${participant?.name || targetName}`,
                    description: `Cannot perform maneuvers${durationMessage ? ` ${durationMessage}` : ''}`,
                    status: 'warning',
                    duration: 4000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added ENSNARED ${eff.rank} to ${targetName} (${displayDuration} rounds)`);
    };

    // Add KNOCKED DOWN (also add PRONE for ongoing state)
    const handleAddKnockedDown = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        // Immediate reminder toast
        toast({
            title: `KNOCKED DOWN: ${targetName}`,
            description: `Treat as Prone until they spend a maneuver to stand.`,
            status: 'info',
            duration: 4000,
            isClosable: true,
        });

        // Add a 'prone' ongoing effect to represent the state
        const eff = StatusFactories.prone(nanoid(), target);
        const effect: Effect = {
            ...eff,
            apply: (participant) => {
                toast({
                    title: `PRONE (from Knocked Down): ${participant?.name || targetName}`,
                    description: `Stand up with a maneuver.`,
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added KNOCKED DOWN (Prone) to ${targetName}`);
    };

    // Add BURN X for N rounds, deal wounds each round-end
    const handleAddBurn = () => {
        if (!selectedParticipantId) return;
        const target = withTarget(selectedParticipantId);
        const targetName = findParticipantName(selectedParticipantId);

        const eff = StatusFactories.burn(nanoid(), target, burnRank, burnDuration);
        const effect: Effect = {
            ...eff,
            apply: (participant) => {
                if (!participant) return;
                const dmg = eff.overTimeDamage ?? eff.rank ?? 1;
                // Apply wounds directly
                const store = useParticipantStore.getState();
                if (participant.id) {
                    store.addWounds(participant.id, dmg);
                }
                toast({
                    title: `BURN ${eff.rank}: ${participant.name}`,
                    description: `Suffers ${dmg} wounds at round end.`,
                    status: 'warning',
                    duration: 4000,
                    isClosable: true,
                });
            }
        };

        addEffect(effect, target);
        successToast(`Added BURN ${eff.rank} to ${targetName}${eff.duration ? ` (${eff.duration} rounds)` : ''}`);
    };

    return (
        <ContentCard heading="Effects">
            <VStack spacing={4} align="stretch">
                <ActiveEffectsDisplay />

                {/* Debug Controls */}
                <Card bg="gray.700" borderColor="gray.600" borderWidth="1px">
                    <CardBody>
                        <VStack spacing={4} align="stretch">
                            <Heading size="sm" color="gray.200">Debug Controls</Heading>

                            <Tooltip label="Reduce the duration of all effects by 1">
                                <Button
                                    onClick={() => {
                                        const allEffects = effects;
                                        allEffects.forEach(effect => {
                                            if (typeof effect.remainingDuration === 'number' && effect.remainingDuration > 0) {
                                                decrementEffectDuration(effect.id);
                                                if (effect.effect.apply) {
                                                    const participant = effect.target.type === 'character' && effect.target.participantId
                                                        ? participants.find(p => p.id === effect.target.participantId)
                                                        : undefined;

                                                    const durationMessage =
                                                        typeof effect.remainingDuration === 'number' && effect.remainingDuration > 0
                                                            ? ` (${effect.remainingDuration - 1} rounds remaining)`
                                                            : ' (expiring)';

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

                            <Tooltip label="Open Spotlight search (Cmd/Ctrl+K)">
                                <Button
                                    onClick={openSpotlight}
                                    width="full"
                                    colorScheme="purple"
                                    variant="outline"
                                >
                                    Open Spotlight
                                </Button>
                            </Tooltip>

                        </VStack>
                    </CardBody>
                </Card>
            </VStack>
            <Spotlight />
        </ContentCard>
    );
};

export default EffectsPanel;

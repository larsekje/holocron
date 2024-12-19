import React, { useState } from "react";
import {
    Box,
    Heading,
    Text,
    Stack,
    Button,
    Badge,
    useToast,
    Select,
    Input,
} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantStore from "@/state/participantsStore";

import { ActiveEffect } from "@/types/effectTypes";
import { Participant } from "@/state/participantsStore";
import {useEffectStore} from "@/state/effectStore";
import {nanoid} from "nanoid";

const addBurning = (participant: Participant, damage: number, duration: number) => {
    // const addWounds = useParticipantStore((state) => state.addWounds);

    const burningEffect: ActiveEffect = {
        effect: {
            id: nanoid(),
            name: "Burning",
            description: `This participant is burning, taking ${damage} damage per turn.`,
            type: "debuff",
            trigger: "turn-start",
            duration,
            apply: (participant) => {
                // addWounds(participant.id, damage);
                console.log(`${participant.name} takes ${damage} damage from Burning.`);
            },
            end: (participant) => {
                console.log(`${participant.name}'s Burning effect has ended.`);
            },
        },
        remainingDuration: duration,
    };

    return burningEffect;
};

const addFrozen = (participant: Participant, duration: number) => {
    const frozenEffect: ActiveEffect = {
        effect: {
            id: nanoid(),
            name: "Frozen",
            description: `This participant is frozen and cannot act for ${duration} turns.`,
            type: "debuff",
            trigger: "immediate", // No special trigger needed for Frozen
            duration,
            apply: (participant) => {
                console.log(`${participant.name} is frozen and skips their turn.`);
            },
            end: (participant) => {
                console.log(`${participant.name} is no longer frozen.`);
            },
        },
        remainingDuration: duration,
    };

    return frozenEffect;
};

export const EffectsCatalog = {
    Burn: {
        handler: addBurning,
        params: [
            { id: "damage", label: "Damage", type: "number", defaultValue: 0 },
            { id: "duration", label: "Duration (Turns)", type: "number", defaultValue: 1 },
        ], // Metadata for dynamic UI
    },
    Frozen: {
        handler: addFrozen,
        params: [
            { id: "duration", label: "Duration (Turns)", type: "number", defaultValue: 1 },
        ], // No damage for Frozen
    },
};

const EffectManager: React.FC = () => {
    const activeParticipantId = useGameplayStore(
        (state) => state.context.activeParticipantId
    );
    const { participants } = useParticipantStore();
    const { addEffect } = useEffectStore();

    const [effectParams, setEffectParams] = useState<Record<string, Record<string, any>>>({});
    const toast = useToast();

    const activeParticipant = participants.find(
        (participant) => participant.id === activeParticipantId
    );

    // Initialize effect parameters for all effects
    const initializeEffectParams = (): Record<string, Record<string, any>> => {
        const initialParams: Record<string, Record<string, any>> = {};

        Object.entries(EffectsCatalog).forEach(([effectKey, effectData]) => {
            const params = effectData.params; // params always exist in EffectsCatalog
            initialParams[effectKey] = params.reduce(
                (acc, param) => {
                    acc[param.id] = param.defaultValue; // Use the raw `param.defaultValue`!
                    return acc;
                },
                {} as Record<string, any>
            );
        });

        return initialParams;
    };

    React.useEffect(() => {
        setEffectParams(initializeEffectParams());
    }, []);

    // Handle parameter changes for specific effects
    const handleParamChange = (effectKey: string, paramId: string, value: any) => {
        setEffectParams((prev) => ({
            ...prev,
            [effectKey]: {
                ...prev[effectKey],
                [paramId]: value,
            },
        }));
    };

    // Handle applying an effect
    const applyEffectToParticipant = (effectKey: string) => {
        if (!activeParticipant) {
            toast({
                title: "No Active Participant",
                description: "Please select a participant before applying effects.",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        const effectData = EffectsCatalog[effectKey as keyof typeof EffectsCatalog];
        if (!effectData) {
            toast({
                title: "Invalid Effect",
                description: `The effect with key "${effectKey}" could not be found.`,
                status: "error",
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        // Prepare effect parameters (from state or default values)
        const params = effectData.params.map((param) => {
            // Use `effectParams` for user-specified values or fallback to defaults
            return effectParams[effectKey]?.[param.id] ?? param.defaultValue;
        });

        try {
            // Call the handler with the current active participant and parameters
            // @ts-ignore
            const foo = effectData.handler(activeParticipant, ...params);

            addEffect(foo);

            // Notify success
            toast({
                title: "Effect Applied",
                description: `"${foo.effect.name}" applied to ${activeParticipant.name}.`,
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Failed to apply effect:", error);

            // Notify error
            toast({
                title: "Application Failed",
                description: `There was an error applying the effect "${effectData.handler.name}".`,
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        }

    };

    return (
        <Box
            mt={4}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
            boxShadow="md"
        >
            <Heading as="h3" size="md" mb={4}>
                Effect Manager
            </Heading>
            {activeParticipant ? (
                <Stack spacing={6}>
                    {/* Active participant summary */}
                    <Text>
                        <Badge
                            colorScheme={activeParticipant.isPC ? "green" : "purple"}
                            mr={2}
                        >
                            {activeParticipant.isPC ? "PC" : "NPC"}
                        </Badge>
                        <Text as="span" fontWeight="bold">
                            {activeParticipant.name}
                        </Text>{" "}
                        is active.
                    </Text>

                    <Stack spacing={4}>
                        {Object.entries(EffectsCatalog).map(([effectKey, effectData]) => (
                            <Box
                                key={effectKey}
                                p={2}
                                borderWidth="1px"
                                borderRadius="md"
                                bg="white"
                                boxShadow="sm"
                                display="flex"
                                flexDirection="column"
                                gap={2} // Compact spacing
                                _hover={{ boxShadow: "md" }}
                            >
                                {/* Inline Header with Effect Name and Apply Button */}
                                <Stack direction="row" align="center" justify="space-between">
                                    <Heading as="h4" size="sm" isTruncated>
                                        {effectData.handler.name} {/* Effect Name */}
                                    </Heading>
                                    <Button
                                        size="sm"
                                        colorScheme="blue"
                                        onClick={() => applyEffectToParticipant(effectKey)}
                                    >
                                        Apply
                                    </Button>
                                </Stack>

                                {/* Render Dynamic Parameters Inline */}
                                {effectData.params.map((param) => (
                                    <Stack
                                        key={param.id}
                                        direction="row"
                                        align="center"
                                        spacing={2} // Compact inline inputs
                                        w="100%" // Manage alignment
                                    >
                                        <Text fontSize="sm" flexShrink={0} w="50%">
                                            {param.label}:
                                        </Text>
                                        <Input
                                            size="sm"
                                            type={param.type}
                                            value={effectParams[effectKey][param.id] ?? ""}
                                            onChange={(e) =>
                                                handleParamChange(
                                                    effectKey,
                                                    param.id,
                                                    param.type === "number"
                                                        ? Number(e.target.value)
                                                        : e.target.value
                                                )
                                            }
                                        />
                                    </Stack>
                                ))}
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            ) : (
                <Text>No active participant. Select one to apply effects.</Text>
            )}
        </Box>
    );
};

export default EffectManager;
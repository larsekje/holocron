import React from 'react';
import {Box, Flex, Text, Badge, Stack, IconButton, Tooltip, HStack, VStack} from '@chakra-ui/react';
import { CloseIcon, TimeIcon } from '@chakra-ui/icons';
import { useEffectStore } from '@/state/effectStore';

export const ActiveEffectsList: React.FC = () => {
    const allEffects = useEffectStore((state) =>
        Object.values(state.effects).flat()
    ); // Flatten all effects across participants
    const removeEffect = useEffectStore((state) => state.removeEffect); // Function to remove an effect

    return (
        <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="md" bg="gray.50" margin={2}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
                All Active Effects
            </Text>
            {allEffects.length > 0 ? (
                <VStack spacing={4}>
                    {allEffects.map((e, index) => (
                        <Flex
                            key={`${e.effect.id}-${index}`}
                            align="center"
                            justify="space-between"
                            p={3}
                            bg="white"
                            width="100%"
                            borderWidth="1px"
                            borderRadius="md"
                            boxShadow="sm"
                        >
                            {/* Effect Details */}
                            <Box flex="1" mr={3}>
                                <Text fontWeight="bold">{e.effect.name}</Text>
                                <Flex align="center" mt={1}>
                                    <TimeIcon boxSize={4} color="gray.500" mr={2} />
                                    <Text fontSize="sm" color="gray.600">
                                        {e !== null
                                            ? `${e.remainingDuration} turn(s)`
                                            : 'Indefinite'}
                                    </Text>
                                </Flex>
                            </Box>

                            {/* Effect Type */}
{/*                            <Badge
                                colorScheme={
                                    e.effect.type === 'buff'
                                        ? 'green'
                                        : e.effect.type === 'debuff'
                                            ? 'red'
                                            : 'purple'
                                }
                                mr={3}
                            >
                                {e.effect.type.toUpperCase()}
                            </Badge>*/}

                            {/* Remove Button */}
                            <Tooltip label="Remove Effect" fontSize="sm">
                                <IconButton
                                    size="sm"
                                    icon={<CloseIcon />}
                                    aria-label={`Remove ${e.effect.name}`}
                                    onClick={() => {
                                        removeEffect(e.effect.id);
                                    }}
                                />
                            </Tooltip>
                        </Flex>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="sm" color="gray.500">
                    No active effects.
                </Text>
            )}
        </Box>
    );
};
import React from 'react';
import { Box, Flex, Stack, Text, Avatar, Badge, IconButton, Tooltip } from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import useParticipantStore from '@/state/participantsStore';
import useGameplayStore from "@/state/newGameplayStore";

export const ParticipantsList: React.FC = () => {
    const participants = useParticipantStore((state) => state.participants); // Get all participants
    const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);
    const removeParticipant = useParticipantStore((state) => state.removeParticipant); // Function to remove a participant

    return (
        <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="md" bg="gray.50" margin={2}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
                Participants
            </Text>
            {participants.length > 0 ? (
                <Stack spacing={4}>
                    {participants.map((p) => {

                        const isActive = p.id === activeParticipantId;

                        return (
                            <Flex
                                key={p.id}
                                align="center"
                                justify="space-between"
                                p={3}
                                bg="white"
                                borderWidth="1px"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                {/* Participant Avatar and Info */}
                                <Flex align="center" flex="1">
                                    <Avatar name={p.name} size="sm" mr={3} />
                                    <Box>
                                        <Text fontWeight="bold">{p.name}</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            {p.isPC || 'Unknown Role'}
                                        </Text>
                                    </Box>
                                </Flex>

                                {/* Participant Status */}
                                <Badge
                                    colorScheme={isActive ? 'green' : 'red'}
                                    ml={3}
                                    minWidth="70px"
                                    textAlign="center"
                                >
                                    {isActive ? 'Active' : 'Inactive'}
                                </Badge>

                                {/* Actions */}
                                <Flex ml={3}>
                                    <Tooltip label="Edit Participant" fontSize="sm">
                                        <IconButton
                                            size="sm"
                                            icon={<EditIcon />}
                                            aria-label={`Edit ${p.name}`}
                                            variant="ghost"
                                            onClick={() => {
                                                // Trigger edit logic here (e.g., open modal with participant info)
                                                console.log('Edit:', p.name);
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip label="Remove Participant" fontSize="sm">
                                        <IconButton
                                            size="sm"
                                            icon={<DeleteIcon />}
                                            aria-label={`Remove ${p.name}`}
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => removeParticipant(p.id)}
                                        />
                                    </Tooltip>
                                </Flex>
                            </Flex>
                        )
                    })}
                </Stack>
            ) : (
                <Text fontSize="sm" color="gray.500">
                    No participants found.
                </Text>
            )}
        </Box>
    );
};
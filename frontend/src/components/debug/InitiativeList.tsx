import React from "react";
import { Box, Text, Flex, Badge, VStack } from "@chakra-ui/react";

interface InitiativeSlot {
    team: "PC" | "NPC";
    initiative: number;
}

interface InitiativeListProps {
    initiativeOrder: InitiativeSlot[];
}

const InitiativeList: React.FC<InitiativeListProps> = ({ initiativeOrder }) => {
    return (
        <Box mt={4} p={4} borderRadius="md">
            {initiativeOrder.length === 0 ? (
                <Text>No initiative has been set yet.</Text>
            ) : (
                <VStack spacing={3} align="stretch">
                    {initiativeOrder.map((slot, index) => (
                        <Flex
                            key={index}
                            justify="space-between"
                            align="center"
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            bg={slot.team === "PC" ? "green.50" : "purple.50"}
                        >
                            <Flex align="center">
                                <Badge
                                    colorScheme={slot.team === "PC" ? "green" : "purple"}
                                    mr={3}
                                    fontSize="0.9em"
                                >
                                    {slot.team}
                                </Badge>
                                <Text fontWeight="medium">{slot.team} Team</Text>
                            </Flex>
                            <Text fontSize="lg" fontWeight="bold">
                                Initiative: {slot.initiative}
                            </Text>
                        </Flex>
                    ))}
                </VStack>
            )}
        </Box>
    );
};

export default InitiativeList;
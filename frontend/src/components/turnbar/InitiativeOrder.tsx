import React from "react";
import { Box, HStack, Text, Badge, Flex } from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";

const InitiativeOrder: React.FC = () => {
    const initiativeOrder = useGameplayStore((state) => state.context.initiativeOrder);
    const currentTurnIndex = useGameplayStore((state) => state.context.currentTurnIndex);

    const getBoxShadow = (isActive: boolean, isPC: boolean): string => {
        if (isActive) {
            return isPC
                ? "0px 4px 10px rgba(72,187,120,0.5)" // Green for active PC
                : "0px 4px 10px rgba(128,90,213,0.5)"; // Purple for active NPC
        }
        return "sm"; // Small default shadow for inactive
    };

    return (
        <Box
            w="100%"
            h="100%"
            overflowX="auto"
            p={2}
            borderRadius="md"
        >
            <HStack spacing={4} align="center" justify="space-evenly">
                {initiativeOrder.map((slot, index) => {
                    const isActive = currentTurnIndex === index;
                    const isPC = slot.team === "PC";

                    return (
                        <Flex
                            key={index}
                            direction="column"
                            align="center"
                            justify="center"
                            p={3}
                            borderWidth="2px"
                            borderRadius="lg"
                            boxShadow={isActive ? "0px 4px 10px rgba(72,187,120,0.5)" : "sm"}
                            borderColor={isActive ? "green.400" : "gray.300"}
                            bg={isActive ? "green.100" : "gray.50"}
                            minW="70px"
                            maxW="140px"
                            transition="all 0.3s ease"
                        >
                            {/* Team Name / Slot */}
                            <Text
                                fontWeight="bold"
                                fontSize="sm"
                                textAlign="center"
                                color={isActive ? "green.800" : "gray.700"}
                            >
                                {slot.team}
                            </Text>
                        </Flex>
                    );
                })}
            </HStack>
        </Box>
    );
};

export default InitiativeOrder;
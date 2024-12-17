import React from "react";
import { Box, HStack, Text, Badge, Flex } from "@chakra-ui/react";
import useGameplayStore from "@/state/gameplayStore";

const InitiativeOrder: React.FC = () => {
    const { initiativeOrder, currentTurnIndex } = useGameplayStore();

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
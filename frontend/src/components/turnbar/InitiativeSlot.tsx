import React from "react";
import { Box, VStack, Text, Badge, Flex } from "@chakra-ui/react";
import {Effect} from "@/types/effect";

interface SlotProps {
    team: "PC" | "NPC";
    slotIndex: number;
    isActive: boolean;
    effects: Effect[];
}

export const InitiativeSlot: React.FC<SlotProps> = ({ team, slotIndex, isActive, effects }) => {

    return (
        <Flex
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
            {/* Slot Team Name */}
            <Text
                fontWeight="bold"
                fontSize="sm"
                textAlign="center"
                color={isActive ? "green.800" : "gray.700"}
                mb={2}
            >
                {team}
            </Text>
        </Flex>
    );
};
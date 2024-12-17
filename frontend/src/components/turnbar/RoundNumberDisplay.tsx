import React from "react";
import { VStack, Text } from "@chakra-ui/react";

// Define props for the component
interface RoundNumberDisplayProps {
    roundNumber: number; // Accepts a number to be displayed
}

const RoundNumberDisplay: React.FC<RoundNumberDisplayProps> = ({ roundNumber }) => {
    return (
        <VStack spacing="0px" align="center" paddingX="10px">
            {/* Larger, Bold Number */}
            <Text color="white" fontSize="2xl" fontWeight="extrabold" lineHeight="1">
                {roundNumber}
            </Text>
            {/* Smaller, Subtle Text */}
            <Text color="gray.400" fontSize="xs" lineHeight="1" letterSpacing="widest">
                ROUND
            </Text>
        </VStack>
    );
};

export default RoundNumberDisplay;
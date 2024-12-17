import React from "react";
import { HStack, Button, Text } from "@chakra-ui/react";

interface DestinyPoolDisplayProps {
    destinyPool: boolean[]; // Array of booleans; `true` for light side, `false` for dark side
    flipDestinyPoint: (index: number) => void; // Function to handle toggling a destiny point
}

const DestinyPoolDisplay: React.FC<DestinyPoolDisplayProps> = ({
                                                                   destinyPool,
                                                                   flipDestinyPoint,
                                                               }) => {
    return (
        <HStack spacing={2} wrap="wrap" justify="center">
            {destinyPool.length > 0 ? (
                destinyPool.map((isLightSide, index) => (
                    <Button
                        key={index}
                        borderRadius="full"
                        size="xs"
                        colorScheme={isLightSide ? "blue" : "red"}
                        onClick={() => flipDestinyPoint(index)}
                        _hover={{
                            transform: "scale(1.1)",
                            boxShadow: "lg",
                        }}
                        _active={{
                            transform: "scale(0.9)",
                        }}
                    >
                        {isLightSide ? "L" : "D"}
                    </Button>
                ))
            ) : (
                <Text color="gray.500" fontSize="sm">
                    No points in the pool
                </Text>
            )}
        </HStack>
    );
};

export default DestinyPoolDisplay;
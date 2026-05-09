import React from "react";
import {Button, HStack, Text} from "@chakra-ui/react";

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
                        bg={isLightSide ? "#f0f4ff" : "#3a1c1c"}
                        color={isLightSide ? "#1a1d24" : "#ffd2d2"}
                        borderWidth="1px"
                        borderColor={isLightSide ? "#c5d0e8" : "#7a3535"}
                        boxShadow="0 1px 3px rgba(0,0,0,0.4)"
                        onClick={() => flipDestinyPoint(index)}
                        _hover={{
                            transform: "scale(1.08)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.55)",
                        }}
                        _active={{transform: "scale(0.92)"}}
                        fontWeight="black"
                    >
                        {isLightSide ? "L" : "D"}
                    </Button>
                ))
            ) : (
                <Text color="whiteAlpha.500" fontSize="sm">
                    No points in the pool
                </Text>
            )}
        </HStack>
    );
};

export default DestinyPoolDisplay;
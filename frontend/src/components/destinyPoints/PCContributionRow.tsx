import React from "react";
import { HStack, Box, Text, Button, ButtonGroup } from "@chakra-ui/react";

// Define Types for Props
interface PC {
    id: string;
    name: string;
}

interface PCContributionRowProps {
    pc: PC; // PC object containing participant information (ID and name)
    selectedContribution?: string; // Currently selected contribution for the PC
    handleSelection: (pcId: string, value: string) => void; // Function to handle selection changes
}

const PCContributionRow: React.FC<PCContributionRowProps> = ({
                                                                 pc,
                                                                 selectedContribution,
                                                                 handleSelection,
                                                             }) => {
    return (
        <HStack spacing={4} justify="space-between" align="center">
            {/* Render the PC's name */}
            <Box flex="1">
                <Text fontSize="sm" fontWeight="medium">
                    {pc.name}
                </Text>
            </Box>

            {/* Button Group for Contributions */}
            <ButtonGroup isAttached>
                <Button
                    size="sm"
                    colorScheme="red"
                    variant={selectedContribution === "dark2" ? "solid" : "outline"}
                    onClick={() => handleSelection(pc.id, "dark2")}
                >
                    DD
                </Button>
                <Button
                    size="sm"
                    colorScheme="red"
                    variant={selectedContribution === "dark1" ? "solid" : "outline"}
                    onClick={() => handleSelection(pc.id, "dark1")}
                >
                    D
                </Button>
                <Button
                    size="sm"
                    colorScheme="blue"
                    variant={selectedContribution === "light1" ? "solid" : "outline"}
                    onClick={() => handleSelection(pc.id, "light1")}
                >
                    L
                </Button>
                <Button
                    size="sm"
                    colorScheme="blue"
                    variant={selectedContribution === "light2" ? "solid" : "outline"}
                    onClick={() => handleSelection(pc.id, "light2")}
                >
                    LL
                </Button>
            </ButtonGroup>
        </HStack>
    );
};

export default PCContributionRow;
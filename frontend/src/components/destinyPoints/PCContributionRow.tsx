import React from "react";
import {Box, Button, ButtonGroup, HStack, Text} from "@chakra-ui/react";

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
    const tokenButton = (
        value: string,
        label: string,
        side: "light" | "dark",
    ) => {
        const selected = selectedContribution === value;
        const baseBg = side === "light" ? "#f0f4ff" : "#3a1c1c";
        const baseColor = side === "light" ? "#1a1d24" : "#ffd2d2";
        const baseBorder = side === "light" ? "#c5d0e8" : "#7a3535";
        return (
            <Button
                size="sm"
                onClick={() => handleSelection(pc.id, value)}
                bg={selected ? baseBg : "#0f1114"}
                color={selected ? baseColor : "whiteAlpha.700"}
                borderWidth="1px"
                borderColor={selected ? baseBorder : "whiteAlpha.200"}
                fontWeight="black"
                _hover={{
                    bg: selected ? baseBg : "#1c1e21",
                    color: selected ? baseColor : "white",
                    borderColor: selected ? baseBorder : "whiteAlpha.400",
                }}
            >
                {label}
            </Button>
        );
    };

    return (
        <HStack spacing={4} justify="space-between" align="center">
            <Box flex="1">
                <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.900">
                    {pc.name}
                </Text>
            </Box>

            <ButtonGroup isAttached>
                {tokenButton("dark2", "DD", "dark")}
                {tokenButton("dark1", "D", "dark")}
                {tokenButton("light1", "L", "light")}
                {tokenButton("light2", "LL", "light")}
            </ButtonGroup>
        </HStack>
    );
};

export default PCContributionRow;
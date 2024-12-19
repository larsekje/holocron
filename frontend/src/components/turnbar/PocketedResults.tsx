import React from "react";
import { Box, Grid, Tooltip, Flex, IconButton } from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import usePocketedResultsStore from "@/state/pocketedResultsStore";

const PocketedResults: React.FC = () => {
    const { pocketedResults, clearResults } = usePocketedResultsStore((state) => ({
        pocketedResults: state.pocketedResults,
        clearResults: state.clearResults,
    }));

    return (
        <Box
            w="130px" // Wrap the size around a compact grid
            h="60px"
            p={2}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.300"
            position="relative"
            display="inline-block"
            _hover={{ boxShadow: "md" }}
        >
            {/* Clear Button - Trash Icon */}
            <IconButton
                icon={<DeleteIcon />}
                aria-label="Clear Results"
                size="xs"
                colorScheme="red"
                position="absolute"
                top="5px"
                right="5px"
                onClick={clearResults}
                opacity={0}
                _hover={{ opacity: 1 }}
                transition="opacity 0.2s"
            />

            {/* Pocketed Results Grid (2 rows × 4 columns) */}
            <Grid
                templateColumns="repeat(4, 1fr)" // 4 items per row
                templateRows="repeat(2, 1fr)" // 2 rows
                gap={1} // Small gaps between items
                height="100%"
            >
                {pocketedResults.map((result) => (
                    <Tooltip
                        key={result.id}
                        label={result.source} // Show the source of the result on hover
                        aria-label="Result source tooltip"
                        placement="top"
                        hasArrow
                        bg="gray.700"
                        color="white"
                        fontSize="xs"
                    >
                        <Flex
                            align="center"
                            justify="center"
                            w="25px"
                            h="25px"
                            borderWidth="1px"
                            borderRadius="full"
                            bg="blue.100"
                            borderColor="blue.300"
                            fontSize="xs"
                            fontWeight="bold"
                            textTransform="uppercase"
                            color="blue.800"
                            cursor="pointer"
                            _hover={{ bg: "blue.200", transform: "scale(1.1)" }}
                            transition="all 0.2s"
                        >
                            {result.label[0]} {/* Show first letter as symbol */}
                        </Flex>
                    </Tooltip>
                ))}
            </Grid>
        </Box>
    );
};

export default PocketedResults;
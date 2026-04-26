import React from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import type { Suggestion, SuggestResult } from '@/data/spotlightSuggest';

type Props = {
  result: SuggestResult;
  selectedIndex: number;
  onHover: (idx: number) => void;
  onClick: (item: Suggestion) => void;
};

const SpotlightSuggestPopup: React.FC<Props> = ({ result, selectedIndex, onHover, onClick }) => {
  const items = result.items;
  return (
    <Box
      position="absolute"
      // Anchored under the search input by being inside a zero-height wrapper
      // that sits immediately below the header.
      top="0"
      left="56px"
      // Constrain width so it doesn't hug the entire modal but stays usable.
      minWidth="320px"
      maxWidth="540px"
      maxHeight="320px"
      overflowY="auto"
      bg="#1a1d21"
      border="1px solid"
      borderColor="gray.600"
      borderRadius="md"
      boxShadow="dark-lg"
      zIndex={20}
      py={1}
    >
      <VStack align="stretch" spacing={0}>
        {items.map((it, i) => {
          const isSelected = i === selectedIndex;
          return (
            <HStack
              key={it.insert + ':' + i}
              px={3}
              py={1.5}
              spacing={3}
              cursor="pointer"
              bg={isSelected ? 'gray.700' : 'transparent'}
              _hover={{ bg: 'gray.600' }}
              onMouseEnter={() => onHover(i)}
              onMouseDown={(e) => {
                // Prevent the input from losing focus before the click handler runs.
                e.preventDefault();
              }}
              onClick={() => onClick(it)}
            >
              <Text fontFamily="mono" fontSize="sm" color="gray.100" flexShrink={0}>
                {it.display}
              </Text>
              {it.hint && (
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {it.hint}
                </Text>
              )}
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default SpotlightSuggestPopup;

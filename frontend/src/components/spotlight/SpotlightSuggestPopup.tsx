import React from 'react';
import { Box, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { FiCheck, FiSquare } from 'react-icons/fi';
import type { Suggestion, SuggestResult } from '@/data/spotlightSuggest';

type Props = {
  result: SuggestResult;
  selectedIndex: number;
  /** Insert values currently toggled into the multi-select set. */
  multiSelected: string[];
  onHover: (idx: number) => void;
  onClick: (item: Suggestion) => void;
};

const SpotlightSuggestPopup: React.FC<Props> = ({
  result,
  selectedIndex,
  multiSelected,
  onHover,
  onClick,
}) => {
  const items = result.items;
  const hasMulti = items.some((i) => i.multiSelectable);
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
          const isHighlighted = i === selectedIndex;
          const isToggled = it.multiSelectable && multiSelected.includes(it.insert);
          return (
            <HStack
              key={it.insert + ':' + i}
              px={3}
              py={1.5}
              spacing={3}
              cursor="pointer"
              bg={isHighlighted ? 'gray.700' : 'transparent'}
              _hover={{ bg: 'gray.600' }}
              onMouseEnter={() => onHover(i)}
              onMouseDown={(e) => {
                // Prevent the input from losing focus before the click handler runs.
                e.preventDefault();
              }}
              onClick={() => onClick(it)}
            >
              {it.multiSelectable && (
                <Icon
                  as={isToggled ? FiCheck : FiSquare}
                  boxSize={3.5}
                  color={isToggled ? 'orange.300' : 'gray.500'}
                  flexShrink={0}
                />
              )}
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
        {hasMulti && (
          <Box px={3} py={1} borderTop="1px solid" borderColor="gray.700" mt={1}>
            <Text fontSize="xs" color="gray.500">
              {multiSelected.length > 0
                ? `${multiSelected.length} selected · ⏎ to apply`
                : 'Click multiple to combine · space toggles current'}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SpotlightSuggestPopup;

import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

type SpotlightResultsHeaderProps = {
  title: string;
  count?: number;
  headerBg?: string;
  borderCol?: string;
};

const SpotlightResultsHeader: React.FC<SpotlightResultsHeaderProps> = ({
  title,
  count,
  headerBg = '#1f2226',
  borderCol = 'gray.700',
}) => {
  return (
    <Box
      px={4}
      py={2}
      bg={headerBg}
      position="sticky"
      top={0}
      zIndex={1}
      borderBottom="1px solid"
      borderColor={borderCol}
    >
      <HStack spacing={2}>
        <Text
          fontSize="xs"
          textTransform="uppercase"
          color="gray.400"
          fontWeight="bold"
          letterSpacing="0.08em"
        >
          {title}
        </Text>
        {count != null && (
          <Text fontSize="xs" color="gray.500" letterSpacing="0.04em">
            · {count}
          </Text>
        )}
      </HStack>
    </Box>
  );
};

export default SpotlightResultsHeader;

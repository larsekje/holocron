import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

type SpotlightResultsHeaderProps = {
  title: string;
  headerBg?: string;
  borderCol?: string;
};

const SpotlightResultsHeader: React.FC<SpotlightResultsHeaderProps> = ({
  title,
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
      <HStack>
        <Text
          fontSize="xs"
          textTransform="uppercase"
          color="gray.400"
          fontWeight="bold"
          letterSpacing="0.08em"
        >
          {title}
        </Text>
      </HStack>
    </Box>
  );
};

export default SpotlightResultsHeader;

import React from 'react';
import { Box, HStack, Skeleton } from '@chakra-ui/react';

type SpotlightResultsSkeletonRowProps = {
  rowHeight: number;
};

const SpotlightResultsSkeletonRow: React.FC<SpotlightResultsSkeletonRowProps> = ({ rowHeight }) => {
  return (
    <HStack height={`${rowHeight}px`} spacing={3}>
      <Box flex="1">
        <Skeleton height="4" width="70%" startColor="gray.600" endColor="gray.500" />
        <HStack mt={2} spacing={2}>
          <Skeleton height="3" width="30%" startColor="gray.700" endColor="gray.600" />
          <Skeleton height="3" width="20%" startColor="gray.700" endColor="gray.600" />
        </HStack>
      </Box>
      <Skeleton height="5" width="60px" startColor="purple.700" endColor="purple.600" />
    </HStack>
  );
};

export default SpotlightResultsSkeletonRow;

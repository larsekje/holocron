import React from 'react';
import { HStack, Text, WrapItem } from '@chakra-ui/react';

export interface DetailStatProps {
  label: string;
  value: React.ReactNode;
  borderColor?: string;
  /**
   * Prefix to display before the value (e.g., "+")
   */
  prefix?: string;
}

const DetailStat: React.FC<DetailStatProps> = ({ label, value, borderColor = 'gray.700', prefix = '' }) => {
  return (
    <WrapItem>
      <HStack px={2} py={1} border="1px solid" borderColor={borderColor} borderRadius="md" spacing={2}>
        <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">
          {label}
        </Text>
        <Text color="gray.100" fontWeight="semibold">
          {prefix}
          {value}
        </Text>
      </HStack>
    </WrapItem>
  );
};

export default DetailStat;

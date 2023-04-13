import React from 'react';
import {VStack, Text, Heading} from "@chakra-ui/react";
import {useTurnStore} from "@/turnStore";

const RoundCounter = () => {
  const round = useTurnStore(state => state.round);

  return (
    <VStack spacing="10px" marginLeft="auto">
      <Text fontSize="12px" lineHeight="0px" fontWeight="bold" color="white">Round</Text>
      <Heading fontSize="40px" lineHeight="25px" margin="0px" fontWeight="bold" color="white">{round}</Heading>
    </VStack>
  );
};

export default RoundCounter;

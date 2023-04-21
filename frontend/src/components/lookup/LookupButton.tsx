import React from 'react';
import {Button, HStack, Kbd, Text} from "@chakra-ui/react";
import {SearchIcon} from "@chakra-ui/icons";

interface Props {
  onOpen: () => void;
}

const LookupButton = ({onOpen}: Props) => {
  return (
    <Button width="400px" onClick={onOpen} bg="white" cursor="pointer" userSelect="none" justifyContent="space-between">
      <HStack>
        <SearchIcon/>
        <Text>Search talents</Text>
      </HStack>
      <span><Kbd>ctrl</Kbd>+<Kbd>k</Kbd></span>
    </Button>
  );
};

export default LookupButton;

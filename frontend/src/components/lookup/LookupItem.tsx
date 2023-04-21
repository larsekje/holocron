import React from 'react';
import {Box, HStack, ListItem, Text, VStack} from "@chakra-ui/react";
import {Talent} from "@/dataStore";
import {nanoid} from "nanoid";
import {Icon} from "@chakra-ui/icons";
import {FaDiceD20} from "react-icons/all";

interface Props {
  talent: Talent;
}

const LookupItem = ({talent}: Props) => {
  return (
    <ListItem key={nanoid()} >
      <Box padding="5px 10px" bg="blue.50" cursor="pointer" borderRadius="5" margin="0 5px 5px 5px">
        <HStack>
          <Icon as={FaDiceD20} margin="0 4px" color="blackAlpha.600"/>
          <VStack justifyContent="left" alignItems="left" spacing="0">
            <Text fontSize="12px" as="b" color="blackAlpha.600">Talent</Text>
            <Text as="b" color="blackAlpha.800">{talent.name}</Text>
          </VStack>
        </HStack>
      </Box>

    </ListItem>
  );
};

export default LookupItem;

import {Flex, Heading, HStack, IconButton} from "@chakra-ui/react";
import {HamburgerIcon} from "@chakra-ui/icons";
import React from "react";
import Lookup from "@components/lookup/Lookup";

const NavBar = () => {

  return (
    <Flex width="100%" height="100%" alignItems="center">
      <HStack position="absolute" left="10px">
        <IconButton aria-label="Expand menu" icon={<HamburgerIcon />} colorScheme="blackAlpha"></IconButton>
        <Heading color="whiteAlpha.700">GM Holocron</Heading>
      </HStack>

      <Flex justifyContent="center" alignItems="center" width="100%">
        <Lookup />
      </Flex>
    </Flex>
  );
};

export default NavBar;

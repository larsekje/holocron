import {Heading, HStack, IconButton} from "@chakra-ui/react";
import {HamburgerIcon} from "@chakra-ui/icons";
import React from "react";

const NavBar = () => {
  return (
    <HStack padding={'0 10px'}>
      <IconButton aria-label='Expand menu' icon={<HamburgerIcon />} colorScheme='blackAlpha'></IconButton>
      <Heading>GM Holocron</Heading>
    </HStack>
  );
};

export default NavBar;

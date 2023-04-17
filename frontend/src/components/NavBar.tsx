import {Heading, HStack, IconButton, Text} from "@chakra-ui/react";
import {HamburgerIcon} from "@chakra-ui/icons";
import React from "react";
import {useDataStore} from "@/dataStore";

const NavBar = () => {

  const loading = useDataStore(state => state.loading);

  return (
    <HStack padding={'0 10px'}>
      <IconButton aria-label='Expand menu' icon={<HamburgerIcon />} colorScheme='blackAlpha'></IconButton>
      <Heading>GM Holocron</Heading>
      <Text color="white">{loading ? "Loading" : "Not loading"}</Text>
    </HStack>
  );
};

export default NavBar;

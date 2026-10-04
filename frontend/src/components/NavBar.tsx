import {Button, Heading, HStack, IconButton, Tooltip} from "@chakra-ui/react";
import {HamburgerIcon} from "@chakra-ui/icons";
import React from "react";

interface Props {
  onOpenSetPieces?: () => void;
}

const NavBar = ({onOpenSetPieces}: Props) => {
  return (
    <HStack padding={'0 10px'} width="100%" justifyContent="space-between">
      <HStack>
        <IconButton aria-label='Expand menu' icon={<HamburgerIcon />} colorScheme='blackAlpha'></IconButton>
        <Heading>GM Holocron</Heading>
      </HStack>
      {onOpenSetPieces && (
        <Tooltip label="Set pieces [s]" placement="bottom">
          <Button size="sm" colorScheme="blue" onClick={onOpenSetPieces}>
            Set pieces [s]
          </Button>
        </Tooltip>
      )}
    </HStack>
  );
};

export default NavBar;

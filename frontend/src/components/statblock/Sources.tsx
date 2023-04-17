import React from 'react';
import {Box, Tooltip} from "@chakra-ui/react";
import {Icon} from "@chakra-ui/icons";
import {FaScroll} from "react-icons/all";
import {book} from "@/utils";

interface Props {
  sources: string[]
}

const Sources = ({sources}: Props) => {
  let sourceString = sources
    .filter(t => t.includes("book"))
    .map(t => book(t))
    .join(", ")

  return (
    <Tooltip label={sourceString} placement="bottom" hasArrow>
      <Box>
        <Icon as={FaScroll} color="white" cursor="pointer"/>
      </Box>
    </Tooltip>
  );
};

export default Sources;

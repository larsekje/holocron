import React from 'react';
import {Box, Icon} from "@chakra-ui/react";
import {FaScroll} from "react-icons/fa";
import {book, isSourceTag} from "@/utils/statify";
import SwrpgTooltip from "@components/common/SwrpgTooltip";

interface Props {
  tags: string[];
}

const SourcesOld = ({tags}: Props) => {
  const sources = (tags ?? []).filter(isSourceTag).map(book);
  if (sources.length === 0) return null;

  const description = sources.join(", ");

  return (
    <SwrpgTooltip title="Sources" description={description}>
      <Box display="inline-flex" cursor="pointer">
        <Icon as={FaScroll} color="whiteAlpha.800" boxSize="14px"/>
      </Box>
    </SwrpgTooltip>
  );
};

export default SourcesOld;

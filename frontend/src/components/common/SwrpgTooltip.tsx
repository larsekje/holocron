import React, {ReactNode} from 'react';
import {Box, Text, Tooltip} from '@chakra-ui/react';
import type {PlacementWithLogical} from '@chakra-ui/popper';
import {renderSwrpgText} from '@/utils/swrpgText';

interface Props {
  title: string;
  description?: string;
  placement?: PlacementWithLogical;
  // Optional preformatted body — if absent we render description with renderSwrpgText.
  body?: ReactNode;
  children: React.ReactElement;
}

const SwrpgTooltip: React.FC<Props> = ({title, description, body, placement = "top", children}) => {
  if (!description && !body) return children;

  return (
    <Tooltip
      hasArrow
      placement={placement}
      openDelay={200}
      bg="#1f2125"
      color="gray.100"
      borderColor="whiteAlpha.200"
      borderWidth="1px"
      borderRadius="md"
      maxW="360px"
      px={3}
      py={2}
      label={
        <Box fontSize="xs">
          <Text
            as="b"
            fontSize="10px"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="#d39939"
            mb={1}
            display="block"
          >
            {title}
          </Text>
          {body ?? renderSwrpgText(description)}
        </Box>
      }
    >
      {children}
    </Tooltip>
  );
};

export default SwrpgTooltip;

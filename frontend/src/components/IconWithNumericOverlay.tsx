import React from 'react';
import {Icon} from "@chakra-ui/icons";
import {Center, Tooltip} from "@chakra-ui/react";

interface Props {
  Icond: any;
  value?: number;
  label: string;
  offsetX?: number;
  offsetY?: number;
}


const IconWithNumericOverlay = ({Icond, value, label="", offsetX=0, offsetY=0}: Props) => {
  return (
    <Tooltip hasArrow label={label} placement="top" openDelay={500}>
      <Center position="relative" w="100%" h="100%" padding="6% 0">
        <Icon as={Icond} height="100%" width="100%" color="coral"/>
        <Center position="absolute" transform="translate(-50%, -50%)" top="50%" left="50%" color="white" fontWeight="bold"
                fontSize="1rem" userSelect={"none"}>
          {value}
        </Center>
      </Center>
    </Tooltip>
  );
};

export default IconWithNumericOverlay;

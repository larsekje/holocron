import React from 'react';
import {HStack, Text} from "@chakra-ui/react";
import {BsCircle, BsCircleFill} from "react-icons/all";
import {IconType} from "react-icons";

interface Props {
  name: string;
  rank: number;
  group?: boolean;
}

const SkillItem = ({name, rank, group=false}: Props) => {
  const icon: IconType = group
    ? BsCircleFill
    : BsCircle;

  const iconElement = React.createElement(icon, {color: 'white', fontSize: '10px'});

  return (
    <HStack justifyContent='space-between'>
      <HStack>
        {iconElement}
        <Text userSelect='none' color='white'>{name}</Text>
      </HStack>
      <Text userSelect='none' color='white'>{rank}</Text>
    </HStack>
  );
};

export default SkillItem;

import React from 'react';
import {Tooltip, Text} from "@chakra-ui/react";
import qualities from "@/assets/data/qualities/qualities.json";

interface Props {
  quality: string;
}

const WeaponQuality = ({quality}: Props) => {

  const description = qualities.find(q => q.name === quality.replace(/\s\d+$/, ""))?.description;
  return (
    <Tooltip hasArrow placement="top" label={description}>
      <Text fontSize="xs" color="white" userSelect="none" cursor="pointer">{quality}</Text>
    </Tooltip>
  );
};

export default WeaponQuality;

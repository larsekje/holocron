import React from 'react';
import {HStack, IconButton, Progress, Text} from "@chakra-ui/react";
import {AddIcon, MinusIcon} from "@chakra-ui/icons";

interface Props {
  name: string;
  max: number;
  current: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const HealthBar = ({name, max, current, onDecrease, onIncrease}: Props) => {
  return (
    <>
      <Text>{name}</Text>
      <HStack>
        <Progress width='100%' colorScheme='green' bg='#25272a' value={current} max={max} borderRadius='5px'/>
        <IconButton size='8px' bg='none' aria-label='decrease' icon={<MinusIcon onClick={onDecrease}/>}/>
        <IconButton size='8px' bg='none' aria-label='increase' icon={<AddIcon onClick={onIncrease}/>}/>
      </HStack>
    </>
  );
};

export default HealthBar;

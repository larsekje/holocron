import React from 'react';
import {VStack, Text, Circle, Center} from "@chakra-ui/react";

interface Props {
  name: string;
  value: number;
  setCurrentCharacteristic: (characteristic: string) => void;
}

const CharacteristicItem = ({name, value, setCurrentCharacteristic}: Props) => {
  return (
    <VStack onMouseOver={() => setCurrentCharacteristic(name.toLowerCase())} onMouseLeave={() => setCurrentCharacteristic('')}>
      <Circle bg='white' size='30px'>
        <Text as='b' fontSize='xl'>{value}</Text>
      </Circle>
      <Center bg='white' width='100px' justifyContent='center' alignItems='center'>
        {name}
      </Center>
    </VStack>
  );
};

export default CharacteristicItem;
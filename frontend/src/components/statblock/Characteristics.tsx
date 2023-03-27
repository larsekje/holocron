import React from 'react';
import {HStack, VStack} from "@chakra-ui/react";
import CharacteristicItem from "./CharacteristicItem";

interface Props {
  brawn: number;
  agility: number;
  cunning: number;
  presence: number;
  intelligence: number;
  willpower: number;
}

const Characteristics = ({brawn, agility, cunning, presence, intelligence, willpower}: Props) => {
  return (
    <HStack>
      <CharacteristicItem name={"Brawn"} value={brawn}/>
      <CharacteristicItem name={"Agility"} value={agility}/>
      <CharacteristicItem name={"Cunning"} value={cunning}/>
      <CharacteristicItem name={"Presence"} value={presence}/>
      <CharacteristicItem name={"Intelligence"} value={intelligence}/>
      <CharacteristicItem name={"Willpower"} value={willpower}/>
    </HStack>
  );
};

export default Characteristics;

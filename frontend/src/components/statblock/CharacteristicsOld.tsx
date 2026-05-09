import React from 'react';
import {Box, HStack} from "@chakra-ui/react";
import CharacteristicItemOld from "./CharacteristicItemOld";
import {capitalize} from "@/utils/statify";

export interface CharacteristicSet {
  brawn: number;
  agility: number;
  intellect: number;
  cunning: number;
  willpower: number;
  presence: number;
}

interface Props {
  characteristics: CharacteristicSet;
  setCurrentCharacteristic: (characteristic: string) => void;
  onEdit?: (key: keyof CharacteristicSet, value: number) => void;
}

// Connected book-style stat strip: single yellow band running through all six characteristic
// circles, with brown chevron-pointed ribbons under each. Mirrors the FFG layout from the
// style guide (`June 2020/00_Templates`).
const CharacteristicsOld = ({characteristics, setCurrentCharacteristic, onEdit}: Props) => {
  const entries = Object.entries(characteristics) as Array<[keyof CharacteristicSet, number]>;

  return (
    <Box py={1} position="relative" w="100%">
      <HStack spacing={5} align="flex-start" justify="center">
        {entries.map(([name, value]) => (
          <CharacteristicItemOld
            key={name}
            name={capitalize(name)}
            value={value}
            setCurrentCharacteristic={setCurrentCharacteristic}
            onEdit={onEdit ? (v) => onEdit(name, v) : undefined}
          />
        ))}
      </HStack>
    </Box>
  );
};

export default CharacteristicsOld;

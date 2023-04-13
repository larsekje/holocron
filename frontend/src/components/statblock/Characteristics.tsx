import React from "react";
import { HStack } from "@chakra-ui/react";
import CharacteristicItem from "./CharacteristicItem";
import { Adversary } from "@/components/StatSheet";
import { capitalize } from "@/utils";

interface Props {
  characteristics: Adversary["characteristics"];
  setCurrentCharacteristic: (characteristic: string) => void;
}

const Characteristics = ({
  characteristics,
  setCurrentCharacteristic,
}: Props) => {
  let items = [];
  for (const [name, value] of Object.entries(characteristics)) {
    items.push(
      <CharacteristicItem
        name={capitalize(name)}
        value={value}
        setCurrentCharacteristic={setCurrentCharacteristic}
      />
    );
  }

  return <HStack>{items}</HStack>;
};

export default Characteristics;

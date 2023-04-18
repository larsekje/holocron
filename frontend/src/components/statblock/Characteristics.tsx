import React from "react";
import { HStack } from "@chakra-ui/react";
import CharacteristicItem from "./CharacteristicItem";
import { capitalize } from "@/utils";
import {Adversary} from "@/adversary";

interface Props {
  characteristics: Adversary["characteristics"];
  setCurrentCharacteristic?: (characteristic: string) => void;
}

const Characteristics = ({
  characteristics,
}: Props) => {
  let items = [];
  for (const [name, value] of Object.entries(characteristics)) {
    items.push(
      <CharacteristicItem
        name={capitalize(name)}
        value={value}
        setCurrentCharacteristic={() => console.log("hei")}
      />
    );
  }

  return <HStack>{items}</HStack>;
};

export default Characteristics;

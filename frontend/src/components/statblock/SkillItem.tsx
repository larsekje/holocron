import React, { useState } from "react";
import {HStack, Text} from "@chakra-ui/react";
import { capitalize } from "@/utils";
import {DicePool, DicePoolC} from "./DicePool";
import ListedSkill from "@components/statblock/ListedSkill";

interface Props {
  name: string;
  rank: number;
  pool: DicePool;
  currentCharacteristic?: string;
  group?: boolean;
  onClick: () => void;
  abbreviated?: boolean;
}

const SkillItem = ({name, rank, pool, onClick, group = false, abbreviated=false}: Props) => {
  const [hover, setHover] = useState(false);

  const isListedSkill: boolean = group || rank > 0

  return (
    <HStack
      justifyContent="space-between"
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      cursor="pointer"
      onClick={onClick}
    >
      <HStack>
        {!abbreviated && <ListedSkill listedSkill={isListedSkill}/>}
        <Text as={hover ? "u" : undefined} userSelect="none" color="white">
          {capitalize(name)}
        </Text>
      </HStack>
      <DicePoolC pool={pool}/>
    </HStack>
  );
};

export default SkillItem;

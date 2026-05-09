import React, {useState} from 'react';
import {HStack, Text} from "@chakra-ui/react";
import DicePoolOld, {DicePool} from "./DicePoolOld";
import ListedSkillOld from "./ListedSkillOld";

interface Props {
  name: string;
  // The lowercase characteristic name driving this row's dice pool
  // (e.g. "willpower" for a Lightsaber (Willpower) entry).
  characteristic: string;
  rank: number;
  pool: DicePool;
  currentCharacteristic?: string;
  group?: boolean;
  abbreviated?: boolean;
  onClick?: () => void;
}

const SkillItemOld = ({
  name,
  characteristic,
  rank,
  pool,
  currentCharacteristic = "",
  onClick,
  group = false,
  abbreviated = false,
}: Props) => {
  const [hover, setHover] = useState(false);

  const isListedSkill = group || rank > 0;

  const dimmed = currentCharacteristic !== "" && characteristic !== currentCharacteristic;
  const color = dimmed ? "gray.500" : "white";

  return (
    <HStack
      justifyContent="space-between"
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      opacity={dimmed ? 0.55 : 1}
      transition="opacity 0.1s ease"
    >
      <HStack>
        {!abbreviated && <ListedSkillOld listedSkill={isListedSkill}/>}
        <Text as={hover ? "u" : undefined} userSelect="none" color={color}>
          {name}
        </Text>
      </HStack>
      <DicePoolOld pool={pool}/>
    </HStack>
  );
};

export default SkillItemOld;

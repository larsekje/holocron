import React, { useState } from "react";
import {
  HStack,
  Text,
} from "@chakra-ui/react";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { IconType } from "react-icons";
import skillMap from "../../skillMap";
import { capitalize } from "../../utils";
import {DicePool, DicePoolC} from "./DicePool";

interface Props {
  name: string;
  rank: number;
  pool: DicePool;
  currentCharacteristic?: string;
  group?: boolean;
}

const SkillItem = ({
  name,
  rank,
  pool,
  currentCharacteristic = "",
  group = false,
}: Props) => {
  const [hover, setHover] = useState(false);

  const icon: IconType = (group || rank > 0) ? BsCircleFill : BsCircle;
  const iconElement = React.createElement(icon, {
    color: "white",
    fontSize: "10px",
  });

  const characteristic = skillMap[name];
  const characteristicHighlighted = characteristic === currentCharacteristic || currentCharacteristic === "";
  const color = characteristicHighlighted ? "white" : "gray";

  return (
    <HStack
      justifyContent="space-between"
      bg={hover ? "tomato" : ""}
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <HStack>
        {iconElement}
        <Text userSelect="none" color={rank === 0 ? 'gray': color}>
          {rank}
        </Text>
        <Text userSelect="none" color={color}>
          {capitalize(name)}
        </Text>
      </HStack>
      <DicePoolC pool={pool}/>
    </HStack>
  );
};

export default SkillItem;

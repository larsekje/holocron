import React, { useState } from "react";
import {
  HStack,
  Text,
} from "@chakra-ui/react";
import { BsCircle, BsCircleFill } from "react-icons/all";
import { IconType } from "react-icons";
import skillMap from "../../skillMap";
import { capitalize } from "../../utils";

interface Props {
  name: string;
  rank: number;
  currentCharacteristic?: string;
  group?: boolean;
}

const SkillItem = ({
  name,
  rank,
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
        <Text userSelect="none" color={color}>
          {capitalize(name)}
        </Text>
      </HStack>
      <Text userSelect="none" color={color}>
        {rank}
      </Text>
    </HStack>
  );
};

export default SkillItem;

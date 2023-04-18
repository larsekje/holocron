import React, { useState } from "react";
import {
  HStack,
  Text, Tooltip,
} from "@chakra-ui/react";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { IconType } from "react-icons";
import { capitalize } from "@/utils";
import {DicePool, DicePoolC} from "./DicePool";

interface Props {
  name: string;
  rank: number;
  pool: DicePool;
  currentCharacteristic?: string;
  group?: boolean;
  onClick: () => void;
}

const SkillItem = ({name, rank, pool, onClick, group = false}: Props) => {
  const [hover, setHover] = useState(false);

  const listedSkill: boolean = group || rank > 0

  const icon: IconType = listedSkill ? BsCircleFill : BsCircle;
  const iconElement = React.createElement(icon, {
    color: "white",
    fontSize: "10px",
  });

  return (
    <HStack
      justifyContent="space-between"
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      cursor="pointer"
      onClick={onClick}
    >
      <HStack>
        <Tooltip hasArrow placement="top" openDelay={200} label={listedSkill ? "Skill listed in profile" : "Skill not listed in profile"}>
          <div>
            {iconElement}
          </div>
        </Tooltip>
        <Text as={hover ? "u" : undefined} userSelect="none" color="white">
          {capitalize(name)}
        </Text>
      </HStack>
      <DicePoolC pool={pool}/>
    </HStack>
  );
};

export default SkillItem;

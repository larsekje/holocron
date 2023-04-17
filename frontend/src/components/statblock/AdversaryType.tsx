import React from 'react';
import {Center, Tooltip} from "@chakra-ui/react";

import {ReactComponent as Ability} from "@/assets/dice/ability.svg";
import {ReactComponent as Proficiency} from "@/assets/dice/proficiency.svg";
import {ReactComponent as Difficulty} from "@/assets/dice/difficulty.svg";
import {ReactComponent as Challenge} from "@/assets/dice/challenge.svg";
import {ReactComponent as Setback} from "@/assets/dice/setback.svg";
import {capitalize} from "@/utils";

interface Props {
  type: string;

}

const AdversaryType = ({type}: Props) => {
  type = type.toLowerCase();

  let IconComponent;
  let label;

  if (type === "minion"){
    IconComponent = Setback;
    label = capitalize(type);
  } else if (type === "rival"){
    IconComponent = Difficulty;
    label = capitalize(type);
  } else if (type === "nemesis"){
    IconComponent = Challenge;
    label = capitalize(type);
  } else if (type === "player"){
    IconComponent = Proficiency;
    label = capitalize(type);
  } else if (type === "npc") {
    IconComponent = Ability;
    label = "Player-controlled NPC";
  } else {
    IconComponent = undefined;
    label = "";
  }

  if (IconComponent === undefined){
    return null;
  }

  return (
    <Tooltip hasArrow label={label}>
      <Center height="40px">
        <IconComponent width="40px" cursor="pointer"/>
      </Center>
    </Tooltip>

  );
};

export default AdversaryType;

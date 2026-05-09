import React from 'react';
import {Center, Icon} from '@chakra-ui/react';

import {ReactComponent as Ability} from "@/assets/dice/ability.svg";
import {ReactComponent as Proficiency} from "@/assets/dice/proficiency.svg";
import {ReactComponent as Difficulty} from "@/assets/dice/difficulty.svg";
import {ReactComponent as Challenge} from "@/assets/dice/challenge.svg";
import {ReactComponent as Setback} from "@/assets/dice/setback.svg";

interface Props {
  type?: string;
  isPC?: boolean;
  clout?: number;
}

const icons: Record<string, any> = {
  minion: Setback,
  rival: Difficulty,
  nemesis: Challenge,
  pc: Proficiency,
  player: Proficiency,
  npc: Ability,
};

const AdversaryTypeBadgeOld = ({type, isPC, clout}: Props) => {
  const key = (type ?? (isPC ? "pc" : "minion")).toLowerCase();
  const IconComponent = icons[key] ?? Ability;

  return (
    <Center position="relative" w="100%" h="100%" padding="6% 0">
      <Icon as={IconComponent} height="100%" width="100%" color="coral"/>
      {clout != null && (
        <Center
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          color="white"
          fontWeight="bold"
          fontSize="1rem"
          userSelect="none"
          textShadow="0 1px 2px rgba(0,0,0,0.6)"
        >
          {clout}
        </Center>
      )}
    </Center>
  );
};

export default AdversaryTypeBadgeOld;

import React from 'react';

import {ReactComponent as Ability} from "@/assets/dice/ability.svg";
import {ReactComponent as Proficiency} from "@/assets/dice/proficiency.svg";
import {ReactComponent as Difficulty} from "@/assets/dice/difficulty.svg";
import {ReactComponent as Challenge} from "@/assets/dice/challenge.svg";
import {ReactComponent as Setback} from "@/assets/dice/setback.svg";
import IconWithNumericOverlay from "@components/target/IconWithNumericOverlay";

interface Props {
  type: string;
  number?: number;
}

const AdversaryTypeBadge = ({type, number}: Props) => {
  const icons = {
    minion: Setback,
    rival: Difficulty,
    nemesis: Challenge,
    player: Proficiency,
    npc: Ability
  }

  const labels = {
    minion: "Minion",
    rival: "Rival",
    nemesis: "Nemesis",
    player: "Player",
    npc: "Player-controlled NPC"
  }

  const IconComponent = icons[type.toLowerCase()];
  const label = labels[type.toLowerCase()]

  return (
    <IconWithNumericOverlay Icond={IconComponent} value={number} label={label}/>
  )
};

export default AdversaryTypeBadge;

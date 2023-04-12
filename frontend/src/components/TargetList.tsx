import React from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./target/TargetCard";
import {Target} from "../target";
import {useTargetStore} from "../targetStore";
import {useTurnStore} from "../turnStore";
import {useHotkeys} from "react-hotkeys-hook";

interface Props {
  usedForChoosingActivePlayer?: boolean
}

const TargetList = ({usedForChoosingActivePlayer=false}: Props) => {

  // targetStore
  let targets = useTargetStore(state => state.targets);
  const setSelectedTarget = useTargetStore(state => state.selectTarget);
  const setActive = useTargetStore(state => state.setActive);
  const nextTarget = useTargetStore(state => state.nextTarget);
  const prevTarget = useTargetStore(state => state.prevTarget);

  // turnStore
  const setChoosingActivePlayer = useTurnStore(state => state.setChoosingActivePlayer);
  const isChoosingActivePlayer = useTurnStore(state => state.isChoosingActivePlayer);
  const isisActiveSlotNPC = useTurnStore(state => state.isActiveSlotNPC)();

  if (usedForChoosingActivePlayer){
    targets = targets.filter(target => (target.isNPC && isisActiveSlotNPC) || (!target.isNPC && !isisActiveSlotNPC));

    for (let [index, target] of targets.entries()) {
      let hotkey = (index + 1).toString();
      useHotkeys(hotkey, () => handleTargetClick(target));
    }
  } else {
      useHotkeys("down", nextTarget);
      useHotkeys("up", prevTarget);
  }

  const handleTargetClick = (target: Target) => {
    if (isChoosingActivePlayer)
      setActive(target);
    else
      setSelectedTarget(target);
      setChoosingActivePlayer(false);
  }

  return (
    <VStack>
      {targets.map(target =>
        <TargetCard
          target={target}
          onClick={() => handleTargetClick(target)}
        />)}
    </VStack>
  );
};

export default TargetList;

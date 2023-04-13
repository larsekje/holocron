import React from 'react';
import ContentCard from "./ContentCard";
import StatusCard from "./statuscard/StatusCard";
import {useTargetStore} from "@/targetStore";
import {useTurnStore} from "@/turnStore";
import TargetList from "./TargetList";

const ContentCardActive = () => {

  // targetStore
  const active = useTargetStore(state => state.activePlayer);

  // turnStore
  const isChoosingActivePlayer = useTurnStore(state => state.isChoosingActivePlayer);

  return (
    <ContentCard heading={active.template.name}>
      {!isChoosingActivePlayer && <StatusCard target={active}/>}
      {isChoosingActivePlayer && <TargetList usedForChoosingActivePlayer={true}/>}
    </ContentCard>
  );
};

export default ContentCardActive;

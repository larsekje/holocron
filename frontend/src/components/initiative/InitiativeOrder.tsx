import React from 'react';
import InitiativeMarker from "./InitiativeMarker";
import {HStack} from "@chakra-ui/react";
import {useTurnStore} from "@/turnStore";

interface Props {

}

const InitiativeOrder = ({}: Props) => {
  const initiativeSlots = useTurnStore(state => state.initiativeSlots);
  const activeInitiativeSlotId = useTurnStore(state => state.activeInitiativeSlotId);

  return (
    <HStack justifyContent="center" spacing="0px">
      {initiativeSlots.map(slot => (<InitiativeMarker id={slot.id} activeId={activeInitiativeSlotId} isNPC={slot.isNPC}/>))}
    </HStack>
  );
};

export default InitiativeOrder;

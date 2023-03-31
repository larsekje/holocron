import React from 'react';
import InitiativeMarker from "./InitiativeMarker";
import {HStack} from "@chakra-ui/react";

interface Props {

}

const InitiativeOrder = ({}: Props) => {
  return (
    <HStack justifyContent="center" spacing="0px">
      <InitiativeMarker pc={true} active={true}/>
      <InitiativeMarker pc={false}/>
      <InitiativeMarker pc={true}/>
    </HStack>
  );
};

export default InitiativeOrder;

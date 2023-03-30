import React from 'react';
import {Text} from "@chakra-ui/react";
import ContentCard from "./ContentCard";
import StatusCard from "./statuscard/StatusCard";
import AdjustHealth from "./AdjustHealth";
import ResetHealth from "./ResetHealth";
import {useTargetStore} from "../targetStore";

const ContentCardActive = () => {
  const active = useTargetStore(state => state.activePlayer);

  return (
    <ContentCard heading={active.template.name}>
      <Text>
        <StatusCard target={active}/>
        <AdjustHealth/>
        <ResetHealth/>
      </Text>
    </ContentCard>
  );
};

export default ContentCardActive;

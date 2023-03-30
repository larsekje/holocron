import React from 'react';
import {Text} from "@chakra-ui/react";
import ContentCard from "./ContentCard";
import StatusCard from "./statuscard/StatusCard";
import AdjustHealth from "./AdjustHealth";
import ResetHealth from "./ResetHealth";
import {useTargetStore} from "../targetStore";

const ContentCardActive = () => {
  const target = useTargetStore(state => state.targets)[0];

  return (
    <ContentCard heading={'Active'}>
      <Text>
        <StatusCard target={target}/>
        <AdjustHealth/>
        <ResetHealth/>
      </Text>
    </ContentCard>
  );
};

export default ContentCardActive;

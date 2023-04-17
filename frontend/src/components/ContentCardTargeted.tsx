import React from 'react';
import ContentCard from "./ContentCard";
import HeadingButton from "./HeadingButton";
import StatSheet from "@components/StatSheet";
import {Text} from "@chakra-ui/react";
import {useTargetStore} from "@/targetStore";

const ContentCardTargeted = () => {
  const selectedTarget = useTargetStore(state => state.selectedTarget);
  const setActiveTarget = useTargetStore(state => state.setActiveTarget);

  const setActiveTargetButton = <HeadingButton key="target-setActive" text='Set Active' shortcut={'a'} onClick={() => setActiveTarget(selectedTarget)}/>
  const buttons = [setActiveTargetButton]

  return (
    <ContentCard heading='Targeted' buttons={buttons}>
      {selectedTarget
        ? <StatSheet target={selectedTarget}/>
        : <Text>No target selected. Select a target from the Targets list.</Text>}
    </ContentCard>
  );
};

export default ContentCardTargeted;

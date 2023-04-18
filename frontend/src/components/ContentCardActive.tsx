import React from 'react';
import ContentCard from "./contentCardMain/ContentCard";
import {useTargetStore} from "@/targetStore";
import StatSheet from "@components/statblock/StatSheet";

const ContentCardActive = () => {

  const activeTarget = useTargetStore(state => state.activeTarget);

  if (activeTarget === undefined){
    return (
      <ContentCard heading={"Active"}>
        No active target is selected.
      </ContentCard>
    )
  }

  return (
    <ContentCard heading="Active">
      <StatSheet target={activeTarget}/>
    </ContentCard>
  );
};

export default ContentCardActive;

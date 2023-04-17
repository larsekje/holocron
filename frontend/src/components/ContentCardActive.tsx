import React from 'react';
import ContentCard from "./contentCardMain/ContentCard";
import {useTargetStore} from "@/targetStore";

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
    <ContentCard heading={activeTarget.template.name}>

    </ContentCard>
  );
};

export default ContentCardActive;

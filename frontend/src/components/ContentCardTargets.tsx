import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";

const ContentCardTargets = () => {
  return (
    <ContentCard heading={'Targets'}>
      <TargetList count={4}/>
    </ContentCard>
  );
};

export default ContentCardTargets;

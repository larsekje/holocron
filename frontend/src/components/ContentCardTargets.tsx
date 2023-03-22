import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import {AddIcon, ViewIcon} from "@chakra-ui/icons";
import HeadingButton from "./HeadingButton";

const ContentCardTargets = () => {

  const addTargetButton = <HeadingButton text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={() => console.log("Add Target")}/>
  const buttons = [addTargetButton]

  return (
    <ContentCard heading={'Targets'} buttons={buttons}>
      <TargetList count={4}/>
    </ContentCard>
  );
};

export default ContentCardTargets;

import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import {AddIcon} from "@chakra-ui/icons";
import {FaBug} from "react-icons/fa";
import HeadingButton from "./HeadingButton";

const ContentCardTargets = () => {

  const addTargetButton = <HeadingButton text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={() => console.log("Add Target")}/>
  const buttons = [addTargetButton]

  return (
    <ContentCard heading={'Targets'} buttons={buttons} icon={<FaBug/>}>
      <TargetList count={4}/>
    </ContentCard>
  );
};

export default ContentCardTargets;

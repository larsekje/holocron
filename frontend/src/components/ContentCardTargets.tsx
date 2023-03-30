import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import {AddIcon} from "@chakra-ui/icons";
import {FaBug} from "react-icons/fa";
import HeadingButton from "./HeadingButton";
import {useTargetStore} from "../targetStore";

const ContentCardTargets = () => {
  const targets = useTargetStore(state => state.targets);

  const addTargetButton = <HeadingButton text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={() => console.log("Add Target")}/>
  const buttons = [addTargetButton]

  return (
    <ContentCard heading={'Targets'} buttons={buttons} icon={<FaBug/>}>
      <TargetList targets={targets}/>
    </ContentCard>
  );
};

export default ContentCardTargets;

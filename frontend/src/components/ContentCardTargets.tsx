import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import {AddIcon} from "@chakra-ui/icons";
import {FaBug} from "react-icons/fa";
import HeadingButton from "./HeadingButton";


export interface Target {
  id: number;
  name: string;
  wt: number;
  isSelected: boolean;
}

interface Props {
  targets: Target[];
}

const ContentCardTargets = ({targets}: Props) => {

  const addTargetButton = <HeadingButton text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={() => console.log("Add Target")}/>
  const buttons = [addTargetButton]

  return (
    <ContentCard heading={'Targets'} buttons={buttons} icon={<FaBug/>}>
      <TargetList targets={targets}/>
    </ContentCard>
  );
};

export default ContentCardTargets;

import React, {useState} from 'react';
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

const ContentCardTargets = () => {

  const targets: Target[] = [
    {
      id: 1,
      name: "Imperial Stormtrooper",
      wt: 5,
      isSelected: false
    },
    {
      id: 2,
      name: "Thenn Hodar",
      wt: 11,
      isSelected: false
    },
    {
      id: 3,
      name: "Juggernaut",
      wt: 15,
      isSelected: false
    },
    {
      id: 4,
      name: "Stormtrooper Sergeant",
      wt: 8,
      isSelected: false
    }
  ]

  const addTargetButton = <HeadingButton text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={() => console.log("Add Target")}/>
  const buttons = [addTargetButton]

  return (


    <ContentCard heading={'Targets'} buttons={buttons} icon={<FaBug/>}>
      <TargetList targets={targets}/>
    </ContentCard>
  );
};

export default ContentCardTargets;

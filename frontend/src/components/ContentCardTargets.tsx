import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import {AddIcon} from "@chakra-ui/icons";
import {FaBug} from "react-icons/fa";
import HeadingButton from "./HeadingButton";


export interface Target {
  name: string;
  wt: number;
}

const ContentCardTargets = () => {

  const targets: Target[] = [
    {
      name: "Imperial Stormtrooper",
      wt: 5
    },
    {
      name: "Thenn Hodar",
      wt: 11
    },
    {
      name: "Juggernaut",
      wt: 15
    },
    {
      name: "Stormtrooper Sergeant",
      wt: 8
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

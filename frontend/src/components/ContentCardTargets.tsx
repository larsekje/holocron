import React from 'react';
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import {AddIcon} from "@chakra-ui/icons";
import {FaBug} from "react-icons/fa";
import HeadingButton from "./HeadingButton";
import {Adversary} from "./StatSheet";


export class Target {
  id: number;
  template: Adversary;
  isSelected: boolean = false;

  constructor(id: number, adversary: Adversary) {
    this.id = Math.random();
    this.template = adversary;
  }

  get name(): string {
    return this.template.name;
  }

  get wt(): number {
    return this.template.derived.wt;
  }

  get soak(): number {
    return this.template.derived.soak;
  }
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

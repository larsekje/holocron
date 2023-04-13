import React, { useState } from "react";
import {
  Divider,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react";
import Characteristics from "./statblock/Characteristics";
import SkillList from "./statblock/SkillList";
import StatusCard from "./statuscard/StatusCard";
import {Target} from "@/target";
import {symbolise} from "@/utils";
import {Interweave} from "interweave";
import {ParsedText} from "./ParsedChakra";

export interface Adversary {
  name: string;
  type: string;
  tags: string[];
  gear: string[];
  description: string;
  derived: {
    wt: number;
    st: number | null;
    soak: number;
    meleeDefense: number | null;
    rangedDefense: number | null;
  }
  characteristics: {
    brawn: number;
    agility: number;
    cunning: number;
    presence: number;
    intelligence: number;
    willpower: number;
  };
  skills: Skill[];
}

export interface Skill {
  name: string;
  rank: number | null;
}

interface Props {
  target?: Target;
}

const StatSheet = ({ target }: Props) => {
  const [currentCharacteristic, setCurrentCharacteristic] = useState("");

  if (target === undefined)
    return <Text>Nothing selected</Text>

  const adversary = target.template;

  return (
    <div>
      <HStack>
        <Heading size="md" color="white">
          {adversary.name}
        </Heading>
        <Text color="white" as="i">
          EotE 404
        </Text>
      </HStack>
      <Text color="white" as="i">
        {adversary.type}, {adversary.tags.join(", ")}
      </Text>

      <Divider />
      <StatusCard target={target}/>
      <Characteristics
        characteristics={adversary.characteristics}
        setCurrentCharacteristic={setCurrentCharacteristic}
      />
      <Divider />

      <Heading color="white" size="lg">
        Skills
      </Heading>
      <Divider />

      <SkillList skills={adversary.skills} characteristics={adversary.characteristics} currentCharacteristic={currentCharacteristic} />
      <Divider />
      <Text color="white">
        <b>Adversary 2:</b> Upgrade difficulty of all combat checks against this
        target twice
      </Text>
      <Text color="white">
        <b>Feral Strength 2:</b> +2 damage on all Brawl and Melee attacks
      </Text>
      <Text color="white">
        <Interweave content={symbolise("<b>Knockdown:</b> May spend :triumph: to knock target prone with successful melee attack")}/>
      </Text>
      <Divider />
      <ParsedText color="white">
        <b>Pirate Leader:</b> May make an :average: Leadership check to give orders to other pirate allies in medium range, granting them :boost: on their next check.
      </ParsedText>
      <Divider />

      <Heading paddingTop="5" color="white" size="lg">
        Description
      </Heading>
      <Divider />

      <Text color="white">{adversary.description}</Text>
      <br />
      <Text color="white">
        <b>Equipment:</b> {adversary.gear.join(", ")}
      </Text>
    </div>
  );
};

export default StatSheet;

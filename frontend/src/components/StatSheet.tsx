import React from 'react';
import {CardFooter, Divider, Heading, Highlight, HStack, Stat, Text, VStack} from "@chakra-ui/react";
import ListItemHighlight from "./ListItemHighlight";
import Characteristics from "./statblock/Characteristics";
import SkillList from "./statblock/SkillList";
import StatusCard from "./statuscard/StatusCard";
import HealthBar from "./statuscard/HealthBar";

interface Adversary {
  name: string;
  type: string;
  tags: string[];
  gear: string[];
  description: string;
}

interface Props {
  adversary?: Adversary;
}

const StatSheet = ({adversary}: Props) => {

  adversary = {
    name: "Imperial Stormtrooper",
    type: "Minion",
    description: "Stormtroopers who survive engagements with high marks are promoted to the position of sergeant. Typically this involves command of a single squadron, but stormtroopers who excel at leadership are promoted to higher ranks. Such positions can include supervision of entire companies of stormtroopers. Rank within the stormtrooper legions is difficult for outsiders to fully understand, as they refer to virtually any officer from their ranks as commander. The uniformity of their armour and this tendency for vague references helps to enforce the image of stormtroopers as an absolutely faceless, monolithic military entity, which only serves to enhance their fearsome reputation.",
    gear: ["Stormtrooper amor (+2 soak)", "utility belt", "extra reloads"],
    tags: ["Imperial", "Stormtrooper"]
  }

  return (
    <div>
      <HStack>
        <Heading size='md' color='white'>{adversary.name}</Heading>
        <Text color='white' as='i'>EotE 404</Text>
      </HStack>
      <Text color='white' as='i'>{adversary.type}, {adversary.tags.join(', ')}</Text>

      <Divider/>
      <StatusCard/>
      <Characteristics brawn={2} agility={2} cunning={3} presence={4} intelligence={2} willpower={4}/>
      <Divider />

      <Heading color='white' size='lg'>Skills</Heading>
      <Divider />

      <SkillList />
      <Divider />
      <Text color='white'><b>Adversary 2:</b> Upgrade difficulty of all combat checks against this target twice</Text>
      <Text color='white'><b>Feral Strength 2:</b> +2 damage on all Brawl and Melee attacks</Text>
      <Text color='white'><b>Knockdown:</b> May spend T to knock target prone with successful melee attack</Text>
      <Divider />
      <Text color='white'><b>Pirate Leader:</b> May spend a maneuver giving orders to other pirate allies in medium range, granting them B on their next check.</Text>
      <Divider />

      <Heading paddingTop='5' color='white' size='lg'>Description</Heading>
      <Divider />

      <Text color='white'>{adversary.description}</Text>
      <br/>
      <Text color='white'><b>Equipment:</b> {adversary.gear.join(", ")}</Text>

    </div>
  );
};

export default StatSheet;

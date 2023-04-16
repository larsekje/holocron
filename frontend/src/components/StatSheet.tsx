import React, { useState } from "react";
import {
    Divider,
    Heading,
    HStack, List,
    Text,
} from "@chakra-ui/react";
import Characteristics from "./statblock/Characteristics";
import SkillList from "./statblock/SkillList";
import StatusCard from "./statuscard/StatusCard";
import {Target} from "@/target";
import {ParsedText} from "./ParsedChakra";
import {statify} from "@/utils";
import {useDataStore} from "@/dataStore";

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

    const getTalent = useDataStore((state) => state.getTalent);

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

      {/*<SkillList skills={adversary.skills} characteristics={adversary.characteristics} currentCharacteristic={currentCharacteristic} />*/}
      <Divider />

        <List>
            {adversary.talents && adversary.talents.map(talentName => {
                    let ranked = talentName.match(/\s(\d+)$/);
                    let ranks = ranked ? ranked[1] : 1;

                    let description = getTalent(talentName)?.description;
                    description = statify(description, "", ranks);

                    return (<ParsedText color="white"><strong>{talentName}:</strong> {description}</ParsedText>)
                }
            )}
        </List>

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

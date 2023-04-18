import React from "react";
import {
  Divider,
  Heading,
  HStack, List,
  Text, VStack,
} from "@chakra-ui/react";
import {Target} from "@/target";
import {book, capitalize, statify} from "@/utils";

import Sources from "@components/statblock/Sources";
import AdversaryType from "@components/statblock/AdversaryType";
import StatusCard from "@components/statuscard/StatusCard";
import {ParsedText} from "@components/textFormatting/ParsedChakra";
import {useDataStore} from "@/dataStore";
import SkillList from "@components/statblock/SkillList";

export interface Skill {
  name: string;
  rank: number | null;
}

interface Props {
  target: Target;
}

const StatSheet = ({ target }: Props) => {
  const getTalent = useDataStore(state => state.getTalent);
  const adversary = target.template;

  const tags = adversary.tags
    .filter(t => !t.includes("book"))
    .map(t => capitalize(t))
    .join(", ");

  return (
    <>
      <HStack height="50px" marginBottom="10px" marginRight="5">
        <AdversaryType type={adversary.type}/>
        <VStack alignItems="left" spacing="0px" width="100%">
          <HStack justifyContent="space-between">
            <Heading size="md" color="white">{adversary.name}</Heading>
          </HStack>
          <Text color="white" as="i">{tags}</Text>
        </VStack>
        <Sources sources={adversary.tags}/>
      </HStack>

      <StatusCard target={target}/>


      <SkillList profileSkills={adversary.skills} characteristics={adversary.characteristics} currentCharacteristic="Intellect" minions={target.minions}/>
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

      <Heading paddingTop="5" color="white" size="lg">
        Description
      </Heading>
      <Divider />

      <Text color="white">{adversary.description}</Text>

      {adversary.gear && (
        <>
          <br />
          <Text color="white">
            <b>Equipment:</b> {adversary.gear.join(", ")}
          </Text>
        </>
      )}

    </>
  );
};

export default StatSheet;

import React from "react";
import {
    Divider,
    Heading,
    HStack, List,
    Text,
} from "@chakra-ui/react";
import StatusCard from "./statuscard/StatusCard";
import {Target} from "@/target";
import {ParsedText} from "./ParsedChakra";
import {statify} from "@/utils";
import {useDataStore} from "@/dataStore";

export interface Skill {
  name: string;
  rank: number | null;
}

interface Props {
  target: Target;
}

const StatSheet = ({ target }: Props) => {
    const getTalent = useDataStore((state) => state.getTalent);


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
    </div>
  );
};

export default StatSheet;

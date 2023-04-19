import React from 'react';
import {
  Card,
  CardBody,
  HStack,
  Text, Tooltip
} from "@chakra-ui/react";
import HealthBar from "./HealthBar";
import {Target} from "@/target";
import Talent from "@components/statblock/targetStatus/Talent";

interface Props {
  target: Target;
  type: string;
  talents?: string[];
  minions?: number
}

const TargetStatus = ({target, type, talents, minions}: Props) => {

  const incrementHealth = () => console.log("Increment health");
  const decrementHealth = () => console.log("Decrement health");

  const isNemesis = type === "Nemesis";

  const ordinaryHealthBar = (<HealthBar name='Wounds' max={target.template.derived.wounds} current={7} onDecrease={decrementHealth} onIncrease={incrementHealth} minions={minions}/>);

  return (
    <Card margin='10px 0'>
        <CardBody width='100%' padding='2'>
          {ordinaryHealthBar}
          {isNemesis && <HealthBar name='Strain' max={20} current={16} onDecrease={decrementHealth} onIncrease={incrementHealth}/>}

          <HStack paddingTop="10px">
            <Text fontSize='sm'>Soak <strong>{target.template.derived.soak}</strong></Text>
            <Text fontSize='sm'>|</Text>
            <Text fontSize='sm'>Defense <strong>M{target.template.derived?.defence?.[0] ?? 0} R{target.template.derived?.defence?.[1] ?? 0}</strong> </Text>
            {getTalentsToHighlight(talents).map(t =><><Text fontSize='sm'>|</Text><Talent talent={t}/></>)}
            {showMinions(minions)}

          </HStack>
        </CardBody>
    </Card>
  );
};

function findTalent(talent: string, talents: string[]) {
  return talents.find(t => t.includes(talent));
}

function getTalentsToHighlight(talents: string[] | undefined): string[]{
  if (talents === undefined)
    return [];

  let talentsToHighlight = ["Adversary", "Nobody's Fool"];

  return talentsToHighlight
    .map(f => findTalent(f, talents))
    .filter((f): f is string => f !== undefined);
}

function showMinions(minions: number | undefined) {
  if (minions === undefined)
    return null;

  return (
      <>
        <Text fontSize='sm'>|</Text>
        <Tooltip hasArrow placement="top" label="Change group size" openDelay={200}>
          <Text userSelect="none" cursor="pointer" fontSize='sm' color="black">Minions <strong>2/{minions}</strong></Text>
        </Tooltip>
      </>
  )

}


export default TargetStatus;
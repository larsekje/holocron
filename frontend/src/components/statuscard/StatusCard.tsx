import React from 'react';
import {Card, CardBody, Text} from "@chakra-ui/react";
import HealthBar from "./HealthBar";
import {Target} from "@/target";
import {useTargetStore} from "@/targetStore";

interface Props {
  target: Target;
}

const StatusCard = ({target}: Props) => {
  const setHealth = useTargetStore(state => state.setHealth);

  const incrementHealth = () => setHealth(target, target.health + 1);
  const decrementHealth = () => setHealth(target, target.health - 1);

  return (
    <Card height='128px' margin='10px 0'>
        <CardBody width='100%' padding='2'>
          <HealthBar name='Wounds' max={target.template.derived.wounds} current={target.health} onDecrease={decrementHealth} onIncrease={incrementHealth}/>
          <HealthBar name='Strain' max={20} current={16} onDecrease={decrementHealth} onIncrease={incrementHealth}/>
          <Text fontSize='sm'>Soak <b>{target.template.derived.soak}</b> | Def <b>M0 / R0</b> | Adversary <b>1</b></Text>
        </CardBody>
    </Card>
  );
};

export default StatusCard;

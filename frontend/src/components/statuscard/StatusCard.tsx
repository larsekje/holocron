import React from 'react';
import {Card, CardBody, Text} from "@chakra-ui/react";
import HealthBar from "./HealthBar";
import {Target} from "../../target";

interface Props {
  target?: Target | null;
}

const StatusCard = ({target}: Props) => {
  return (
    <Card height='128px' margin='10px 0'>
        <CardBody width='100%' padding='2'>
          <HealthBar name='Wounds' max={20} current={16}/>
          <HealthBar name='Strain' max={20} current={16}/>
          <Text fontSize='sm'>Soak <b>3</b> | Def <b>M0 / R0</b> | Adversary <b>1</b></Text>
        </CardBody>
    </Card>
  );
};

export default StatusCard;

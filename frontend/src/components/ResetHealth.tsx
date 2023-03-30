import React from 'react';
import {Button} from "@chakra-ui/react";
import {useTargetStore} from "../targetStore";

const AdjustHealth = () => {

  const target = useTargetStore(state => state.selectedTarget);
  const reset = useTargetStore(state => state.setHealth);

  const handleClick = () => {
    reset(target, 0);
  }

  return (
    <Button onClick={handleClick}>
      Reset Health
    </Button>
  );
};

export default AdjustHealth;

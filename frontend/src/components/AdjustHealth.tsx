import React from 'react';
import {Button} from "@chakra-ui/react";
import {useTargetStore} from "@/targetStore";

const AdjustHealth = () => {

  const target = useTargetStore(state => state.selectedTarget);
  const setHealth = useTargetStore(state => state.setHealth);

  const handleClick = () => {
    setHealth(target, target.health+1);
  }

  return (
    <Button onClick={handleClick}>
      Add 1 Wound
    </Button>
  );
};

export default AdjustHealth;

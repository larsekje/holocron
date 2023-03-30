import React from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent, DrawerFooter,
  DrawerHeader,
  DrawerOverlay, Input, VStack
} from "@chakra-ui/react";
import {useTargetStore} from "../../targetStore";
import targets from "../../targets";
import {Target} from "../../target";
import adversaries from "../../adversaries";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdversarySelectionDrawer = ({isOpen, onClose}: Props) => {

  const setTargets = useTargetStore(state => state.setTargets);
  const addTarget = useTargetStore(state => state.addTarget);
  const removeTarget = useTargetStore(state => state.removeTarget);
  const selectedTarget = useTargetStore(state => state.selectedTarget);

  const handleReset = () => {
    setTargets(targets);
  }

  const handleRemove = () => {
    removeTarget(selectedTarget);
  }

  const handleAddTarget = () => {
    const target = new Target(adversaries[1]);
    addTarget(target);
  }

  return (
    <Drawer
      isOpen={isOpen}
      placement='right'
      onClose={onClose}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Select Adversary</DrawerHeader>

        <DrawerBody>
          <VStack>
            <Input placeholder='Search...' />
            <Button onClick={handleAddTarget} justifyContent="left" width="100%">Add Stormtrooper</Button>
            <Button onClick={handleAddTarget} justifyContent="left" width="100%">Add Sergeant</Button>
            <Button onClick={handleAddTarget} justifyContent="left" width="100%">Add Thug</Button>
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant='outline' mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" mr={3} onClick={handleReset}>Reset</Button>
          <Button colorScheme="red" variant="outline" mr={3} onClick={handleRemove}>Remove</Button>
          <Button colorScheme='blue'>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AdversarySelectionDrawer;

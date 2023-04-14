import React, {useState} from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent, DrawerFooter,
  DrawerHeader,
  DrawerOverlay, Input, List
} from "@chakra-ui/react";
import {useTargetStore} from "@/targetStore";
import targets from "@/targets";
import {Target} from "@/target";
import DiceRed from "@components/dice/DiceRed";
import SymbolFailure from "@components/dice/SymbolFailure";
import DicePurple from "@components/dice/DicePurple";
import DiceBlack from "@components/dice/DiceBlack";
import {useFetchCharacters} from "@/useFetchCharacters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdversarySelectionDrawer = ({isOpen, onClose}: Props) => {

  // component hooks
  const [searchTerm, setSearchTerm] = useState("");

  // target store
  const setTargets = useTargetStore(state => state.setTargets);
  const addTarget = useTargetStore(state => state.addTarget);
  const removeTarget = useTargetStore(state => state.removeTarget);
  const selectedTarget = useTargetStore(state => state.selectedTarget);

  // refs
  const firstField = React.useRef()

  // fetch local data
  const characters = useFetchCharacters();

  // search and filter
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = characters
    .filter(character => character.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // reset on close
  const handleOnClose = () => {
    setSearchTerm("");
    onClose();
  }

  return (
    <Drawer
      isOpen={isOpen}
      placement='right'
      initialFocusRef={firstField}
      onClose={handleOnClose}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Select Adversary</DrawerHeader>

        <DrawerBody>
          <List spacing="5px">
            <Input ref={firstField} placeholder='Search...' value={searchTerm} onChange={handleSearchChange}/>
            {filteredData.map(adversary => {
                const Icon = adversary.type === 'Nemesis' ? DiceRed :
                             adversary.type === 'Rival'   ? DicePurple :
                             adversary.type === 'Minion'  ? DiceBlack : SymbolFailure;
                return(<Button onClick={() => addTarget(new Target(adversary))} justifyContent="left" width="100%">{<Icon/>}{adversary.name}</Button>)
            })}
          </List>
        </DrawerBody>

        <DrawerFooter>
          <Button variant='outline' mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" mr={3} onClick={() => setTargets(targets)}>Reset</Button>
          <Button colorScheme="red" variant="outline" mr={3} onClick={() => removeTarget(selectedTarget)}>Remove</Button>
          <Button colorScheme='blue'>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AdversarySelectionDrawer;

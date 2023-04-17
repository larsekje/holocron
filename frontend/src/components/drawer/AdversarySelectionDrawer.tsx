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
import DiceRed from "@components/dice/DiceRed";
import SymbolFailure from "@components/dice/SymbolFailure";
import DicePurple from "@components/dice/DicePurple";
import DiceBlack from "@components/dice/DiceBlack";
import {useDataStore} from "@/dataStore";
import {useTargetStore} from "@/targetStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdversarySelectionDrawer = ({isOpen, onClose}: Props) => {

  // component hooks
  const [searchTerm, setSearchTerm] = useState("");

  const adversaries = useDataStore(state => state.adversaries);

  // refs
  const firstField = React.useRef()

  // search and filter
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = adversaries
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
                return(<Button onClick={() => console.log("add target")} justifyContent="left" width="100%">{<Icon/>}{adversary.name}</Button>)
            })}
          </List>
        </DrawerBody>

        <DrawerFooter>
          <Button variant='outline' mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" mr={3} onClick={() => console.warn("Functionality removed")}>Reset</Button>
          <Button colorScheme='blue'>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AdversarySelectionDrawer;

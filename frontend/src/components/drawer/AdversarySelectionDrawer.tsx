import React, {useEffect, useState} from 'react';
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
import adversaries from "@/adversaries";
import {Character} from "@/character";
import DiceRed from "@components/dice/DiceRed";
import SymbolFailure from "@components/dice/SymbolFailure";
import DicePurple from "@components/dice/DicePurple";
import DiceBlack from "@components/dice/DiceBlack";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdversarySelectionDrawer = ({isOpen, onClose}: Props) => {

  // component hooks
  const [characters, setCharacters] = useState<Character[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // target store
  const setTargets = useTargetStore(state => state.setTargets);
  const addTarget = useTargetStore(state => state.addTarget);
  const removeTarget = useTargetStore(state => state.removeTarget);
  const selectedTarget = useTargetStore(state => state.selectedTarget);

  // refs
  const firstField = React.useRef()

  // fetch local data
  useEffect(() => {
    const fetchData = async () => {
        const response = await fetch("/assets/a-and-a.json");
        const data = await response.json();
        setCharacters(data);
    };
    fetchData();
  }, []);

  // search and filtering
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = characters
    .filter(character => character.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(character => unnamedCharacters.includes(character.name));


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
                return(<Button onClick={() => addTarget(new Target(adversaries[1]))} justifyContent="left" width="100%">{<Icon/>}{adversary.name}</Button>)
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

// hack to shorten list of adversaries from a-and-a.json
const unnamedCharacters: string[] = [
  "Alliance Fleet Trooper",
  "Specforce Infiltrator",
  "Alliance Driver",
  "Lasan Honour Guard",
  "Politician",
  "Senator",
  "Imperial Armour Corps Crew",
  "Imperial Armour Corps Commander",
  "Imperial Navy Gunner",
  "Stormtrooper: Range Trooper",
  "Gang leader",
  "Swoop Ace",
  "Tusken Raider (AaA)",
  "Weequay Gunsel",
  "Ewok Hunter",
  "Ewok Shaman",
  "Krayt dragon",
  "Loth-wolf",
  "Mouse Droid",
  "Marksman-H Combat Training Remote",
  "Rancor",
  "Sarlacc",
];

export default AdversarySelectionDrawer;

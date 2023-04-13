import React, {useEffect, useState} from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent, DrawerFooter,
  DrawerHeader,
  DrawerOverlay, Input, VStack
} from "@chakra-ui/react";
import {useTargetStore} from "@/targetStore";
import targets from "@/targets";
import {Target} from "@/target";
import adversaries from "@/adversaries";
import {Character} from "@/character";
import DiceRed from "@components/diceSymbols/DiceRed";
import DiceFailure from "@components/diceSymbols/DiceFailure";
import DicePurple from "@components/diceSymbols/DicePurple";
import DiceBlack from "@components/diceSymbols/DiceBlack";

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

  const [characters, setCharacters] = useState<Character[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
        const response = await fetch("/assets/a-and-a.json");
        const data = await response.json();
        setCharacters(data);
    };
    fetchData();
  }, []);

  const characterList = characters.filter(c => unnamedCharacters.includes(c.name));
  console.log(characterList);

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
            {characterList.map(adversary => {
                const Icon = adversary.type === 'Nemesis' ? DiceRed :
                             adversary.type === 'Rival'   ? DicePurple :
                             adversary.type === 'Minion'  ? DiceBlack : DiceFailure;
                return(<Button onClick={handleAddTarget} justifyContent="left" width="100%">{<Icon/>}{adversary.name}</Button>)
            })}
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

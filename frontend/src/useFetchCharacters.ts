import { useState, useEffect } from "react";
import {Character} from "@/character";


export const useFetchCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
      const fetchAndSetCharacters = async () => {
        const fetchedCharacters = await fetchCharacters();
        setCharacters(fetchedCharacters);
      };

      fetchAndSetCharacters();
    });

  return characters;
};

export const fetchCharacters = async(): Promise<Character[]> => {
  const response = await fetch("/assets/a-and-a.json");
  const data: Character[] = await response.json();

  return data
    .filter(character => unnamedCharacters.includes(character.name));
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

import {Target} from "./target";
import {fetchCharacters} from "@/useFetchCharacters";

const characters = await fetchCharacters();

const targets: Target[] = [
  new Target(characters[0]),
  new Target(characters[1]),
  new Target(characters[3]),
  new Target(characters[0]),
  new Target(characters[2]),
];

export default targets;
import {nanoid} from "nanoid";

export class Character {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
  wounds: number;
  maxWounds: number;
  strain: number;
  maxStrain: number;

  constructor(name: string, isPlayer: boolean) {
    this.id = nanoid();
    this.name = name;
    this.initiative = 0;
    this.isPlayer = isPlayer;
    this.wounds = 0;
    this.maxWounds = 10;
    this.strain = 0;
    this.maxStrain = 5;
  }

  rollInitiative = (): number => {
    return Math.floor(Math.random() * 20) + 1;
  }
}
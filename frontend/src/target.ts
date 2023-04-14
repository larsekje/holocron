 import {nanoid} from "nanoid";
import {Character} from "@/character";

export class Target {
  id: string;
  template: Character;
  health: number;
  initiative: number;
  canUseThisSlot: boolean;

  constructor(character: Character) {
    this.id = nanoid();
    this.template = character;
    this.health = 0;
    this.initiative = this.rollInitiative();
    this.canUseThisSlot = false;
  }

  get isNPC(): boolean {
    const adversaryType = this.template.type.toLowerCase();
    return adversaryType === "minion" || adversaryType === "rival" || adversaryType === "nemesis";
  }

  rollInitiative(): number {
    this.initiative = Math.floor(Math.random()*20)
    return this.initiative;
  }

}
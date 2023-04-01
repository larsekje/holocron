import {Adversary} from "./components/StatSheet";
import {nanoid} from "nanoid";

export class Target {
  id: string;
  template: Adversary;
  health: number;
  initiative: number;
  canUseThisSlot: boolean;

  constructor(adversary: Adversary) {
    this.id = nanoid();
    this.template = adversary;
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
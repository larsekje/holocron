 import {nanoid} from "nanoid";
 import {Adversary} from "@/adversary";

export class Target {
  id: string;
  template: Adversary;
  health: number;
  initiative: number;
  minions?: number;
  canUseThisSlot: boolean;

  constructor(adversary: Adversary, minions?: number) {
    this.id = nanoid();
    this.template = adversary;
    this.health = 0;
    this.initiative = this.rollInitiative();
    this.canUseThisSlot = false;
    this.minions = minions;
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
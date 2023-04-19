 import {nanoid} from "nanoid";
 import {Adversary} from "@/adversary";

export class Target {
  id: string;
  template: Adversary;
  health: number;
  initiative: number;
  minions?: number;
  canUseThisSlot: boolean;
  wounds: number;

  constructor(adversary: Adversary, minions?: number, wounds: number = 0, id?: string) {
    this.id = id ? id : nanoid();
    this.template = adversary;
    this.health = 0;
    this.initiative = this.rollInitiative();
    this.canUseThisSlot = false;
    this.minions = minions;
    this.wounds = wounds;
  }

  get isNPC(): boolean {
    const adversaryType = this.template.type.toLowerCase();
    return adversaryType === "minion" || adversaryType === "rival" || adversaryType === "nemesis";
  }

  rollInitiative(): number {
    this.initiative = Math.floor(Math.random()*20)
    return this.initiative;
  }

  // Calculate the number of remaining minions in a group
  get aliveMinions(): number {
    const eliminatedMinions = Math.floor(this.wounds / this.template.derived.wounds);
    const remainingMinions = (this.minions || 0) - eliminatedMinions;
    return Math.max(remainingMinions, 0);
  }

  addWounds(amount: number): void {
    this.wounds += amount;
  }

  removeWounds(amount: number): void {
    this.wounds = Math.max(this.wounds - amount, 0);
  }

  clone() {
    return new Target(this.template, this.minions, this.wounds, this.id);
  }

}
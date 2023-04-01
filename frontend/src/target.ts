import {Adversary} from "./components/StatSheet";
import {nanoid} from "nanoid";

export class Target {
  id: string;
  template: Adversary;
  health: number;

  constructor(adversary: Adversary) {
    this.id = nanoid();
    this.template = adversary;
    this.health = 0;
  }

  get isNPC(): boolean {
    const adversaryType = this.template.type.toLowerCase();
    return adversaryType === "minion" || adversaryType === "rival" || adversaryType === "nemesis";
  }

}
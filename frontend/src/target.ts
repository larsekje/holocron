import {Adversary} from "./components/StatSheet";
import {nanoid} from "nanoid";

export class Target {
  id: string;
  template: Adversary;
  isSelected: boolean = false;

  constructor(adversary: Adversary) {
    this.id = nanoid();
    this.template = adversary;
  }

  get name(): string {
    return this.template.name;
  }

  get wt(): number {
    return this.template.derived.wt;
  }

  get soak(): number {
    return this.template.derived.soak;
  }
}
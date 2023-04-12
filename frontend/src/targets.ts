import adversaries from "./adversaries";
import {Target} from "./target";

const targets: Target[] = [
  new Target(adversaries[0]),
  new Target(adversaries[1]),
  new Target(adversaries[3]),
  new Target(adversaries[0]),
  new Target(adversaries[2]),
];

export default targets;
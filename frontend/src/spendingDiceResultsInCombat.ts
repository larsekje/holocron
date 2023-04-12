export interface DiceResult {
  cost: string;
  result: string[];
}

export const diceTableGood: DiceResult[] = [
  {
    cost: ":advantage: or :triumph:",
    result: [
      "Recover 1 strain (may be selected more than once)",
      "Add :boost: to the next allied active character's check",
      "Notice a single important point in the ongoing conflict, such as the location of a blast door's control panel or a weak point in an attack speeder.",
      "Inflict a Critical Injury with a successful attack that deals damage past soak (:advantage: cost may vary).",
      "Activate a weapon quality (:advantage: cost may vary).",
    ]
  },
  {
    cost: ":advantage::advantage: or :triumph:",
    result: [
      "Perform an immediate free maneuver",
      "Add :setback: to the targeted character's next check.",
      "Add :boost: any allied character's next check, including the active character.",
    ]
  },
  {
    cost: ":advantage::advantage::advantage: or :triumph:",
    result: [
      "Gain +1 melee or ranged defense until the end of the active character's next turn.",
      "Force the target to drop a melee or ranged weapon it is wielding",
    ]
  },
  {
    cost: ":triumph:",
    result: [
      "Upgrade the difficulty of the targeted character's next check.",
      "Upgrade any allied character's next check, including the current active character.",
      "Do something vital, such as shooting the controls to the nearby blast doors to seal them shut.",
    ]
  },
  {
    cost: ":triumph::triumph:",
    result: [
      "When dealing damage to a target, have the attack destroy a piece of equipment the target is using, such as blowing up his blaster or destroying a personal shield generator.",
    ]
  },
]

export const diceTableBad: DiceResult[] = [
  {
    cost: ":threat: or :despair:",
    result: [
      "The active character suffers 1 strain (this option may be selected more than once)",
      "The active character loses the benefits of a prior maneuver (such as from taking cover or assuming a Guarded Stance) until he performs the maneuver again.",
    ]
  },
  {
    cost: ":threat::threat: or :despair:",
    result: [
      "Perform an immediate free maneuver",
      "Add :boost: to the targeted character's next check.",
      "The active character or an allied character suffers :setback: on his next action.",
    ]
  },
  {
    cost: ":threat::threat::threat: or :despair:",
    result: [
      "The character falls prone",
      "The active character grants the enemy a significant advantage in the ongoing encounter, such as accidentally blasting the controls to a bridge he was planning to use for his escape.",
    ]
  },
  {
    cost: ":despair:",
    result: [
      "The character's ranged weapon immediately runs out of ammunition and may not be used for the remainder of the encounter.",
      "Upgrade the difficulty of an allied character's next check, including the current active character",
      "The tool or melee weapon the character is using becomes damaged (see page 159).",
    ]
  },
]
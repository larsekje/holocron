import {Adversary} from "./components/StatSheet";

const adversaries: Adversary[] = [
  {
    name: "Imperial Stormtrooper",
    type: "Minion",
    description:
      "Stormtroopers who survive engagements with high marks are promoted to the position of sergeant. Typically this involves command of a single squadron, but stormtroopers who excel at leadership are promoted to higher ranks. Such positions can include supervision of entire companies of stormtroopers. Rank within the stormtrooper legions is difficult for outsiders to fully understand, as they refer to virtually any officer from their ranks as commander. The uniformity of their armour and this tendency for vague references helps to enforce the image of stormtroopers as an absolutely faceless, monolithic military entity, which only serves to enhance their fearsome reputation.",
    gear: ["Stormtrooper amor (+2 soak)", "utility belt", "extra reloads"],
    tags: ["Imperial", "Stormtrooper"],
    characteristics: {
      brawn: 3,
      agility: 3,
      cunning: 2,
      presence: 1,
      intelligence: 2,
      willpower: 3,
    },
    derived: {
      wt: 5,
      st: null,
      soak: 5,
      meleeDefense: null,
      rangedDefense: null
    },
    skills: [
      {
        name: "Vigilance",
        rank: 3
      },
      {
        name: "Discipline",
        rank: 2
      },
      {
        name: "Melee",
        rank: 3
      },
      {
        name: "Ranged: Heavy",
        rank: 3
      },
    ]
  },
  {
    name: "Stormtrooper Sergeant",
    type: "Rival",
    description:
      "Stormtroopers who survive engagements with high marks are promoted to the position of sergeant. Typically this involves command of a single squadron, but stormtroopers who excel at leadership are promoted to higher ranks. Such positions can include supervision of entire companies of stormtroopers. Rank within the stormtrooper legions is difficult for outsiders to fully understand, as they refer to virtually any officer from their ranks as commander. The uniformity of their armour and this tendency for vague references helps to enforce the image of stormtroopers as an absolutely faceless, monolithic military entity, which only serves to enhance their fearsome reputation.",
    gear: ["Utility belt", "Extra reloads", "Stormtrooper armour (+2 Soak)", "2 Frag grenades"],
    tags: ["Imperial", "Stormtrooper"],
    characteristics: {
      brawn: 3,
      agility: 3,
      cunning: 2,
      presence: 1,
      intelligence: 2,
      willpower: 3,
    },
    derived: {
      wt: 15,
      st: null,
      soak: 6,
      meleeDefense: null,
      rangedDefense: null
    },
    skills: [
      {
        name: "Athletics",
        rank: 2
      },
      {
        name: "Discipline",
        rank: 2
      },
      {
        name: "Leadership",
        rank: 3
      },
      {
        name: "Melee",
        rank: 2
      },
      {
        name: "Ranged: Heavy",
        rank: 2
      },
      {
        name: "Ranged: Light",
        rank: 2
      },
      {
        name: "Resilience",
        rank: 2
      },
      {
        name: "Vigilance",
        rank: 2
      },
    ]
  },

]

export default adversaries;
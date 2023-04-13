
export interface Character {
  name: string;
  type: string;
  description: string;
  characteristics: {
    Brawn: number;
    Agility: number;
    Intellect: number;
    Cunning: number;
    Willpower: number;
    Presence: number;
  };
  derived: {
    soak: number;
    wounds: number;
    strain?: number;
    defence?: [number, number];
  };
  skills: Record<string, number> | string[];
  talents?: string[];
  abilities?: Array<{
    name: string;
    description: string;
  } | string>;
  weapons?: string[];
  gear?: string[];
  tags: string[];
}
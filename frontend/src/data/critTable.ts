
export type CritSeverity = 'Easy' | 'Average' | 'Hard' | 'Daunting' | 'Formidable';

export type CritEntry = {
  min: number;
  max: number;
  severity: CritSeverity;
  title: string;
  summary: string;
};

// Tracked injury entry for a participant
export type CritInjury = {
  id: string;
  title: string;
  severity: CritSeverity;
  summary: string;
  rollTotal: number;
  source: 'personal' | 'vehicle';
  appliedAt: number;
};

const R = (min: number, max: number) => ({ min, max });

// Minimal starter set; expand later
export const critTable: CritEntry[] = [
  { ...R(1, 5),    severity: 'Easy',       title: 'Minor Nick',        summary: 'The target suffers 1 Strain.' },
  { ...R(6, 10),   severity: 'Easy',       title: 'Slowed Down',       summary: 'Acts in the last allied slot on their next turn.' },
  { ...R(11, 15),  severity: 'Easy',       title: 'Sudden Jolt',       summary: 'Drops whatever is held.' },
  { ...R(16, 20),  severity: 'Easy',       title: 'Distracted',        summary: 'Cannot perform a free maneuver during next turn.' },
  { ...R(21, 25),  severity: 'Easy',       title: 'Off-Balance',       summary: 'Add 1 Setback to next skill check.' },
  { ...R(26, 30),  severity: 'Easy',       title: 'Discouraging Wound',summary: 'Flip a Light side Destiny point to Dark (reverse if NPC).' },
  { ...R(31, 35),  severity: 'Easy',       title: 'Stunned',           summary: 'Staggered until end of next turn.' },
  { ...R(36, 40),  severity: 'Average',    title: 'Head Ringer',       summary: 'Increase difficulty of Intellect and Cunning checks until healed.' },
  { ...R(41, 45),  severity: 'Average',    title: 'At the Brink',      summary: 'Suffer 1 Strain each time you perform an action.' },
  { ...R(46, 50),  severity: 'Average',    title: 'Hamstrung',         summary: 'Reduce speed by 1 until end of encounter.' },
  { ...R(51, 55),  severity: 'Average',    title: 'Overpowered',       summary: 'GM may allow attacker an immediate follow-up action.' },
  { ...R(56, 60),  severity: 'Hard',       title: 'Compromised',       summary: 'Increase difficulty of all skill checks until end of encounter.' },
  { ...R(61, 65),  severity: 'Hard',       title: 'Maimed',            summary: 'Lose a limb or major appendage (prosthetic required).' },
  { ...R(66, 70),  severity: 'Hard',       title: 'Horrific Injury',   summary: 'One random characteristic -1 until healed.' },
  { ...R(71, 75),  severity: 'Daunting',   title: 'Temporarily Lame',  summary: 'Cannot perform free maneuvers until end of encounter.' },
  { ...R(76, 80),  severity: 'Daunting',   title: 'Crippled',          summary: 'Half of damage (round up) becomes strain until healed.' },
  { ...R(81, 85),  severity: 'Daunting',   title: 'The End is Nigh',   summary: 'Make a Hard check to act each turn until healed.' },
  { ...R(86, 90),  severity: 'Formidable', title: 'Mortally Wounded',  summary: 'Make a Daunting check at the beginning of each turn or die.' },
  { ...R(91, 95),  severity: 'Formidable', title: 'Bleeding Out',      summary: 'Suffer 1 wound and 1 strain per round until healed.' },
  { ...R(96, 100), severity: 'Formidable', title: 'Deadly Blow',       summary: 'Immediate incapacitation or worse (GM adjudication).' },
];

// Vehicle/starship crit table (starter set; expand with official text later)
export const vehicleCritTable: CritEntry[] = [
  { ...R(1, 5),    severity: 'Easy',       title: 'Mechanical Stress',     summary: 'Suffer system strain.' },
  { ...R(6, 10),   severity: 'Easy',       title: 'Knocked Off Course',    summary: 'Pilot must spend a maneuver to reorient next turn.' },
  { ...R(11, 15),  severity: 'Easy',       title: 'Shields Failing',       summary: 'Defense reduced by 1 in a random arc until repaired.' },
  { ...R(16, 20),  severity: 'Easy',       title: 'Sensor Glare',          summary: 'Add 1 Setback to Gunnery/Computers until end of encounter.' },
  { ...R(21, 25),  severity: 'Easy',       title: 'Control Rattle',        summary: 'Handling reduced by 1 until repaired.' },
  { ...R(26, 30),  severity: 'Average',    title: 'Power Fluctuation',     summary: 'Suffer 2 system strain.' },
  { ...R(31, 35),  severity: 'Average',    title: 'Comm Disruption',       summary: 'Comm actions increase difficulty by 1 until repaired.' },
  { ...R(36, 40),  severity: 'Average',    title: 'Thruster Wash',         summary: 'Speed reduced by 1 until end of next round.' },
  { ...R(41, 45),  severity: 'Average',    title: 'Weapon Jam',            summary: 'One weapon cannot be fired until cleared.' },
  { ...R(46, 50),  severity: 'Average',    title: 'Stabilizer Hit',        summary: 'Pilot checks add 1 Setback until repaired.' },
  { ...R(51, 55),  severity: 'Hard',       title: 'Hull Buckling',         summary: 'Suffer 1 hull trauma ignoring armor.' },
  { ...R(56, 60),  severity: 'Hard',       title: 'Ion Surge',             summary: 'Suffer 3 system strain. If at threshold, disabled.' },
  { ...R(61, 65),  severity: 'Hard',       title: 'Drive Damaged',         summary: 'Speed reduced by 1; can’t exceed current until repaired.' },
  { ...R(66, 70),  severity: 'Hard',       title: 'Shield Overload',       summary: 'Set defense to 0 in one arc until repaired.' },
  { ...R(71, 75),  severity: 'Daunting',   title: 'Flight Computer Fault', summary: 'All Pilot-only checks +1 difficulty until repaired.' },
  { ...R(76, 80),  severity: 'Daunting',   title: 'Structural Stress',     summary: 'Suffer 2 hull trauma ignoring armor.' },
  { ...R(81, 85),  severity: 'Daunting',   title: 'Weapon Mount Shorn',    summary: 'One weapon disabled/destroyed (GM chooses).' },
  { ...R(86, 90),  severity: 'Formidable', title: 'Catastrophic Breach',   summary: 'Vacuum breach/atmosphere venting; immediate action required.' },
  { ...R(91, 95),  severity: 'Formidable', title: 'Reactor Flair',         summary: 'Suffer 5 system strain and 2 hull trauma.' },
  { ...R(96, 100), severity: 'Formidable', title: 'Vessel Crippled',       summary: 'Ship disabled; only damage control possible until repaired.' },
];

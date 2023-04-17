export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function splitArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const result = new Array(n);
  for(let i= 0; i < n; i++){
    result[i] = arr.slice(i * size, (i+1) * size);
  }

  return result;
}

export const symbolise = (text: string) => {
  Object.keys(diceMap).forEach(k => {
    let reg = new RegExp(`:${k}:`, "g");

    text = text.replace(reg, diceMap[k]);
  });

  return text;
}

export const diceMap = {
  // dice
  "boost": "<span class='icon boost'></span>",
  "proficiency": "<span class='icon proficiency'></span>",
  "ability": "<span class='icon ability'></span>",
  "setback": "<span class='icon setback'></span>",
  "challenge": "<span class='icon challenge'></span>",
  "difficulty": "<span class='icon difficulty'></span>",
  "force": "<span class='icon force'></span>",

  // outcomes
  "advantage": "<span class='icon advantage'></span>",
  "failure": "<span class='icon failure'></span>",
  "success": "<span class='icon success'></span>",
  "threat": "<span class='icon threat'></span>",
  "triumph": "<span class='icon triumph'></span>",
  "despair": "<span class='icon despair'></span>",

  // force
  "lightside": "<span class='icon lightside'></span>",
  "darkside": "<span class='icon darkside'></span>",
  "forcepip": "<span class='icon forcepip'></span>",

  // difficulty levels
  "easy": "<strong>Easy</strong> (<span class='icon difficulty'></span>)",
  "average": "<strong>Average</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "hard": "<strong>Hard</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "daunting": "<strong>Daunting</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "formidable": "<strong>Formidable</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",

  // upgraded easy difficulty
  "easy-1": "<strong>Easy</strong> (<span class='icon challenge'></span>)",

  // upgraded average difficulty
  "average-1": "<strong>Average</strong> (<span class='icon challenge'></span><span class='icon difficulty'></span>)",
  "average-2": "<strong>Average</strong> (<span class='icon challenge'></span><span class='icon challenge'></span>)",

  // upgraded hard difficulties
  "hard-1": "<strong>Hard</strong> (<span class='icon challenge'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "hard-2": "<strong>Hard</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon difficulty'></span>)",
  "hard-3": "<strong>Hard</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span>)",

  // upgraded daunting difficulties
  "daunting-1": "<strong>Daunting</strong> (<span class='icon challenge'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "daunting-2": "<strong>Daunting</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "daunting-3": "<strong>Daunting</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon difficulty'></span>)",
  "daunting-4": "<strong>Daunting</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span>)",

  // upgraded formidable difficulties
  "formidable-1": "<strong>Formidable</strong> (<span class='icon challenge'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "formidable-2": "<strong>Formidable</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "formidable-3": "<strong>Formidable</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  "formidable-4": "<strong>Formidable</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon difficulty'></span>)",
  "formidable-5": "<strong>Formidable</strong> (<span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span><span class='icon challenge'></span>)"
};

// add talent ranks, and correct numbers of dice to talent textFormatting
export const statify = function(text, stats, ranks) {
  // convert characteristics and skills
  // Object.keys(stats).forEach(k => textFormatting = textFormatting.replace(new RegExp(`\{${k}\}`, "g"), stats[k]));

  // insert ranks and format
  text = text.replace(/\{ranks}/g, ranks);
  text = text.replace(/\{ranks\|words}/g,        () => words[ranks]);
  text = text.replace(/\{ranks\|times}/g,        () => times[ranks]);
  text = text.replace(/\{ranks\|multiply-10}/g,  () => ranks * 10);
  text = text.replace(/\{ranks\|multiply-50}/g,  () => ranks * 50);
  text = text.replace(/\{ranks\|multiply-100}/g, () => ranks * 100);
  text = text.replace(/\{ranks\|plus-2}/g,       () => ranks + 2);

  // add game symbols a number of times equal to ranks
  ["setback", "boost", "success", "threat", "force"].forEach(symbol => text = text.replace(new RegExp(`\{ranks\\|(${symbol})\}`, "g"), (s, match) => r(match, ranks)));

  return text;
}

function r(symbol, ranks) {
  let buffer = [];

  for(let i = 0; i < ranks; ++i) {
    buffer.push(`:${symbol}:`);
  }

  return buffer.join("");
}

let words = ["", "one", "two", "three", "four", "five"];
let times = ["", "once", "twice", "three times", "four times", "five times"];

// return book name
export const book = function book(name) {
  return name in bookMap ? bookMap[name] : name;
}

let bookMap = {
  // core books
  "book:aor": "Age of Rebellion",
  "book:eote": "Edge of the Empire",
  "book:fad": "Force and Destiny",

  // beginner games
  "book:aorbg": "Age of Rebellion: Beginner’s Game",
  "book:eotebg": "Edge of the Empire: Beginner’s Game",
  "book:tfabg": "The Force Awakens: Beginner’s Game",

  // source books
  "book:lonh": "Lords of Nal Hutta",
  "book:sor": "Strongholds of Resistance",
  "book:sof": "Suns of Fortune",
  "book:nop": "Nexus of Power",
  "book:dor": "Dawn of Rebellion",
  "book:rots": "Rise of the Separatists",
  "book:aaa": "Allies and Adversaries",
  "book:cotr": "Collapse of the Republic",
  "book:gag": "Gadgets and Gear",

  // career books
  "book:dc": "Dangerous Covenants",
  "book:da": "Desparate Allies",
  "book:doh": "Disciples of Harmony",
  "book:ev": "Endless Vigil",
  "book:fh": "Far Horizons",
  "book:fc": "Fly Casual",
  "book:ktp": "Keeping the Peace",
  "book:lbe": "Lead by Example",
  "book:sm": "Special Modifications",
  "book:sot": "Stay on Target",
  "book:ss": "Savage Spirits",
  "book:eto": "Enter the Unknown",
  "book:kof": "Knights of Fate",
  "book:fo": "Fully Operational",
  "book:cam": "Cyphers and Masks",

  // adventures
  "book:oaa": "Onslaught at Arda I",
  "book:cotgk": "Chronicles of the Gatekeeper",
  "book:ragp": "Rescue at Glare Peak",
  "book:uabs": "Under a Black Sun",
  "book:flt": "Friends Like These",
  "book:btr": "Beyond the Rim",
  "book:motpq": "Mask of the Pirate Queen",
  "book:joy": "Jewel of Yavin",
  "book:god": "Ghosts of Dathomir"
};

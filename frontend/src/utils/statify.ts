export const diceMap: Record<string, string> = {
  // dice
  boost: "<span class='icon boost'></span>",
  proficiency: "<span class='icon proficiency'></span>",
  ability: "<span class='icon ability'></span>",
  setback: "<span class='icon setback'></span>",
  challenge: "<span class='icon challenge'></span>",
  difficulty: "<span class='icon difficulty'></span>",
  force: "<span class='icon force'></span>",

  // outcomes
  advantage: "<span class='icon advantage'></span>",
  failure: "<span class='icon failure'></span>",
  success: "<span class='icon success'></span>",
  threat: "<span class='icon threat'></span>",
  triumph: "<span class='icon triumph'></span>",
  despair: "<span class='icon despair'></span>",

  // force
  lightside: "<span class='icon lightside'></span>",
  darkside: "<span class='icon darkside'></span>",
  forcepip: "<span class='icon forcepip'></span>",

  // difficulty levels
  easy: "<strong>Easy</strong> (<span class='icon difficulty'></span>)",
  average: "<strong>Average</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  hard: "<strong>Hard</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  daunting: "<strong>Daunting</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
  formidable: "<strong>Formidable</strong> (<span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span><span class='icon difficulty'></span>)",
};

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const bookMap: Record<string, string> = {
  // core books
  "book:aor": "Age of Rebellion",
  "book:eote": "Edge of the Empire",
  "book:fad": "Force and Destiny",
  // beginner games
  "book:aorbg": "Age of Rebellion: Beginner's Game",
  "book:eotebg": "Edge of the Empire: Beginner's Game",
  "book:tfabg": "The Force Awakens: Beginner's Game",
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
  "book:da": "Desperate Allies",
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
  "book:god": "Ghosts of Dathomir",
};

export function book(tag: string): string {
  if (tag in bookMap) return bookMap[tag];
  if (tag.toLowerCase().startsWith("source:")) return tag.slice(7).trim();
  return tag;
}

// Tags that name a published source: book:xxx or source:xxx (free-form).
export function isSourceTag(tag: string): boolean {
  const t = tag.toLowerCase();
  return t.startsWith("book:") || t.startsWith("source:");
}

export const symbolise = (text: string): string => {
  Object.keys(diceMap).forEach((k) => {
    const reg = new RegExp(`:${k}:`, "g");
    text = text.replace(reg, diceMap[k]);
  });
  return text;
};

const words = ["", "one", "two", "three", "four", "five"];
const times = ["", "once", "twice", "three times", "four times", "five times"];

function repeatSymbol(symbol: string, ranks: number): string {
  return Array.from({length: ranks}, () => `:${symbol}:`).join("");
}

export const statify = (text: string | undefined, _stats: unknown, ranks: number | string): string => {
  if (!text) return "";
  const r = typeof ranks === "number" ? ranks : parseInt(ranks, 10) || 1;

  text = text.replace(/\{ranks\}/g, String(r));
  text = text.replace(/\{ranks\|words\}/g, () => words[r] ?? String(r));
  text = text.replace(/\{ranks\|times\}/g, () => times[r] ?? `${r} times`);
  text = text.replace(/\{ranks\|multiply-10\}/g, () => String(r * 10));
  text = text.replace(/\{ranks\|multiply-50\}/g, () => String(r * 50));
  text = text.replace(/\{ranks\|multiply-100\}/g, () => String(r * 100));
  text = text.replace(/\{ranks\|plus-2\}/g, () => String(r + 2));

  ["setback", "boost", "success", "threat", "force"].forEach((symbol) => {
    text = text.replace(new RegExp(`\\{ranks\\|(${symbol})\\}`, "g"), (_, m) =>
      repeatSymbol(m, r),
    );
  });

  return text;
};

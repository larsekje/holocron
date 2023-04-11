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

import abilityUrl from '@/assets/dice/ability.svg?url';
import proficiencyUrl from '@/assets/dice/proficiency.svg?url';
import boostUrl from '@/assets/dice/boost.svg?url';
import setbackUrl from '@/assets/dice/setback.svg?url';
import difficultyUrl from '@/assets/dice/difficulty.svg?url';
import challengeUrl from '@/assets/dice/challenge.svg?url';
import forceUrl from '@/assets/dice/force.svg?url';

// Utility to convert OggDude-style markup to readable HTML
// - Removes [H3]..[h3] sections entirely; other headings [H1]/[H2]/[H4]/[H5]/[H6] become <hN>
// - Treats [P] as a paragraph break and [BR] as a soft line break
// - Converts content into <p> paragraphs (no stray <br/>)
// - Inline formatting: [B]/[I]/[U]
// - Dice tokens rendered using SVG icons; result tokens via sw-rpg-icons font classes
export function oggToHtml(input: string): string {
  if (!input) return '';

  let html = input;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // Insert structural breaks from tokens
  // [P] -> blank line (new paragraph), [BR] -> single newline (soft break)
  html = html.replace(/\[P\]/gi, '\n\n');
  html = html.replace(/\[BR\]/gi, '\n');

  // Headings: drop H3 content entirely, render others as headings
  for (let n = 1; n <= 6; n++) {
    const re = new RegExp(`\\[H${n}\\]([\\s\\S]*?)\\[h${n}\\]`, 'gi');
      html = html.replace(re, ''); // remove heading 3 blocks completely
  }

  // Inline formatting
  html = html.replace(/\[B\]([\s\S]*?)\[b\]/gi, '<strong>$1</strong>');
  html = html.replace(/\[I\]([\s\S]*?)\[i\]/gi, '<em>$1</em>');
  html = html.replace(/\[U\]([\s\S]*?)\[u\]/gi, '<u>$1</u>');

  // Dice tokens -> SVG icons (stronger outline for Setback to improve contrast)
  const diceImgMap: Record<string, { src: string; title: string; extraStyle?: string }> = {
    '[AB]': { src: abilityUrl, title: 'Ability' },
    '[PR]': { src: proficiencyUrl, title: 'Proficiency' },
    '[BO]': { src: boostUrl, title: 'Boost' },
    '[SE]': { src: setbackUrl, title: 'Setback', extraStyle: 'filter: drop-shadow(0 0 1.5px rgba(255,255,255,0.9)) drop-shadow(0 0 0.5px rgba(255,255,255,0.9));' },
    '[DI]': { src: difficultyUrl, title: 'Difficulty' },
    '[CH]': { src: challengeUrl, title: 'Challenge' },
    '[FO]': { src: forceUrl, title: 'Force' },
  };
  Object.entries(diceImgMap).forEach(([tok, { src, title, extraStyle }]) => {
    const re = new RegExp(escapeRegExp(tok), 'g');
    const baseStyle =
      'height:1em;width:1em;vertical-align:-0.15em;margin:0 2px;display:inline-block;filter: drop-shadow(0 0 1px rgba(255,255,255,0.7));';
    const style = extraStyle ? baseStyle + extraStyle : baseStyle;
    html = html.replace(
      re,
      `<img src="${src}" alt="${title}" title="${title}" style="${style}" />`
    );
  });

  // Result tokens -> sw-rpg-icons font classes (off-white for dark background)
  const resultClassMap: Record<string, { cls: string; label: string }> = {
    '[SU]': { cls: 'success', label: 'Success' },
    '[FA]': { cls: 'failure', label: 'Failure' },
    '[AD]': { cls: 'advantage', label: 'Advantage' },
    '[TH]': { cls: 'threat', label: 'Threat' },
    '[TR]': { cls: 'triumph', label: 'Triumph' },
    '[DE]': { cls: 'despair', label: 'Despair' },
    '[FP]': { cls: 'forcepip', label: 'Force Pip' },
    '[DA]': { cls: 'darkside', label: 'Dark Side' },
    '[LI]': { cls: 'lightside', label: 'Light Side' },
  };
  const resultIconColor = '#E2E8F0'; // off-white (chakra gray.200) for visibility on dark bg
  Object.entries(resultClassMap).forEach(([tok, { cls, label }]) => {
    const re = new RegExp(escapeRegExp(tok), 'g');
    // Do not force inline color for Light Side or Dark Side so SCSS colors apply
    const needsInlineColor = tok !== '[LI]' && tok !== '[DA]';
    const style = needsInlineColor ? `margin:0 2px;color:${resultIconColor};` : 'margin:0 2px;';
    html = html.replace(
      re,
      `<i class="icon ${cls}" aria-label="${label}" title="${label}" style="${style}"></i>`
    );
  });

  // Build paragraphs:
  // - Collapse multiple blank lines
  // - Split on blank lines
  // - Replace single line breaks within paragraphs with spaces
  html = html.replace(/\n{3,}/g, '\n\n');

  const blocks = html
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
    .map((b) => {
      // If the block is a standalone heading tag, return as-is (no paragraph wrapper)
      if (/^<h[1-6]\b[^>]*>[\s\S]*<\/h[1-6]>$/i.test(b)) {
        return b;
      }
      const text = b.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      // Larger bottom margin and relaxed line-height for readability
      return `<p style="margin:0 0 1.25rem 0; line-height:1.7;">${text}</p>`;
    });

  return blocks.join('');
}

// Inline-only renderer: converts tokens and inline formatting without paragraphs or block breaks
export function oggInlineToHtml(input: string): string {
  if (!input) return '';
  let html = input;
  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');
  // Remove heading tokens entirely if present
  html = html.replace(/\[H[1-6]\]([\s\S]*?)\[h[1-6]\]/gi, '$1');
  // Inline formatting
  html = html.replace(/\[B\]([\s\S]*?)\[b\]/gi, '<strong>$1</strong>');
  html = html.replace(/\[I\]([\s\S]*?)\[i\]/gi, '<em>$1</em>');
  html = html.replace(/\[U\]([\s\S]*?)\[u\]/gi, '<u>$1</u>');
  // Dice tokens -> SVG icons
  const diceImgMap: Record<string, { src: string; title: string; extraStyle?: string }> = {
    '[AB]': { src: abilityUrl, title: 'Ability' },
    '[PR]': { src: proficiencyUrl, title: 'Proficiency' },
    '[BO]': { src: boostUrl, title: 'Boost' },
    '[SE]': { src: setbackUrl, title: 'Setback', extraStyle: 'filter: drop-shadow(0 0 1.5px rgba(255,255,255,0.9)) drop-shadow(0 0 0.5px rgba(255,255,255,0.9));' },
    '[DI]': { src: difficultyUrl, title: 'Difficulty' },
    '[CH]': { src: challengeUrl, title: 'Challenge' },
  };
  Object.entries(diceImgMap).forEach(([tok, { src, title, extraStyle }]) => {
    const re = new RegExp(escapeRegExp(tok), 'g');
    const baseStyle =
      'height:1em;width:1em;vertical-align:-0.15em;margin:0 2px;display:inline-block;filter: drop-shadow(0 0 1px rgba(255,255,255,0.7));';
    const style = extraStyle ? baseStyle + extraStyle : baseStyle;
    html = html.replace(
      re,
      `<img src="${src}" alt="${title}" title="${title}" style="${style}" />`
    );
  });
  // Result tokens -> sw-rpg-icons
  const resultClassMap: Record<string, { cls: string; label: string }> = {
    '[SU]': { cls: 'success', label: 'Success' },
    '[FA]': { cls: 'failure', label: 'Failure' },
    '[AD]': { cls: 'advantage', label: 'Advantage' },
    '[TH]': { cls: 'threat', label: 'Threat' },
    '[TR]': { cls: 'triumph', label: 'Triumph' },
    '[DE]': { cls: 'despair', label: 'Despair' },
    '[FP]': { cls: 'forcepip', label: 'Force Pip' },
    '[DA]': { cls: 'darkside', label: 'Dark Side' },
    '[LI]': { cls: 'lightside', label: 'Light Side' },
  };
  const resultIconColor = '#E2E8F0';
  Object.entries(resultClassMap).forEach(([tok, { cls, label }]) => {
    const re = new RegExp(escapeRegExp(tok), 'g');
    const needsInlineColor = tok !== '[LI]' && tok !== '[DA]';
    const style = needsInlineColor ? `margin:0 2px;color:${resultIconColor};` : 'margin:0 2px;';
    html = html.replace(
      re,
      `<i class=\"icon ${cls}\" aria-label=\"${label}\" title=\"${label}\" style=\"${style}\"></i>`
    );
  });
  // [P] and [BR] collapse to simple spaces for inline context
  html = html.replace(/\[P\]/gi, ' ');
  html = html.replace(/\[BR\]/gi, ' ');
  // Collapse whitespace
  html = html.replace(/\s{2,}/g, ' ').trim();
  return html;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

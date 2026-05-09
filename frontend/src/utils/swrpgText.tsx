import React, {ReactNode} from 'react';
import {Text} from '@chakra-ui/react';
import {Interweave} from 'interweave';
import {symbolise, diceMap} from '@/utils/statify';

// Maps the OggDude-style bracketed shorthand (used in spotlightExtras) to the
// existing :colon-tag: syntax that statify/symbolise understands.
const BRACKET_MAP: Record<string, keyof typeof diceMap> = {
  AD: 'advantage',
  TH: 'threat',
  SU: 'success',
  FA: 'failure',
  TR: 'triumph',
  DE: 'despair',
  BO: 'boost',
  SE: 'setback',
  AB: 'ability',
  PR: 'proficiency',
  DI: 'difficulty',
  CH: 'challenge',
  FO: 'force',
  LI: 'lightside',
  DA: 'darkside',
  // common names spelled out
  ADVANTAGE: 'advantage',
  THREAT: 'threat',
  SUCCESS: 'success',
  FAILURE: 'failure',
  TRIUMPH: 'triumph',
  DESPAIR: 'despair',
  BOOST: 'boost',
  SETBACK: 'setback',
};

// Convert "[AD]" / "[TR]" / etc. to ":advantage:" / ":triumph:" so symbolise can render the icon.
function bracketsToColons(text: string): string {
  return text.replace(/\[([A-Z]+)\]/g, (match, code) => {
    const tag = BRACKET_MAP[code as string];
    return tag ? `:${tag}:` : match;
  });
}

// Render SWRPG-flavoured text: dice icons (`[AD]` / `:advantage:`), preserved newlines.
export function renderSwrpgText(text: string | undefined): ReactNode {
  if (!text) return null;
  const html = symbolise(bracketsToColons(text));
  return (
    <Text as="span" whiteSpace="pre-line">
      <Interweave content={html}/>
    </Text>
  );
}

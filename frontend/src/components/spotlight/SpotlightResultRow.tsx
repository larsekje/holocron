import React from 'react';
import { Badge, Box, HStack, Icon, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertTriangle,
  FiCompass,
  FiHeart,
  FiShield,
  FiTarget,
} from 'react-icons/fi';
import type { SpotlightResult } from '@/state/spotlightStore';
import { getDetail } from '@/data/spotlightIndex';
import { lookupField } from '@/data/spotlightQuery';

type SpotlightResultRowProps = {
  r: SpotlightResult;
  idx: number;
  isSelected: boolean;
  onHoverIndex: (idx: number) => void;
  onClickResult: (r: SpotlightResult) => void;
  rowHeight: number;
  /** Field names referenced by the active query — used to pop out the
   * matching stat on each row (e.g. soak gets a coloured pill when the user
   * filters by `soak:>=5` or sorts by `soak:high`). */
  highlightedFields?: Set<string>;
  rowHoverBg?: string;
  rowSelectedBg?: string;
};

// Wrap matched character indexes in a styled span so we can see *why* something matched.
function renderHighlighted(text: string, indexes?: number[]): React.ReactNode {
  if (!indexes || indexes.length === 0) return text;
  const set = new Set(indexes);
  const parts: React.ReactNode[] = [];
  let buf = '';
  let inMatch = false;
  for (let i = 0; i < text.length; i++) {
    const matched = set.has(i);
    if (matched !== inMatch) {
      if (buf) {
        parts.push(
          inMatch ? (
            <Box as="span" key={`m-${parts.length}`} color="yellow.300" fontWeight="700">
              {buf}
            </Box>
          ) : (
            <React.Fragment key={`p-${parts.length}`}>{buf}</React.Fragment>
          ),
        );
        buf = '';
      }
      inMatch = matched;
    }
    buf += text[i];
  }
  if (buf) {
    parts.push(
      inMatch ? (
        <Box as="span" key={`m-${parts.length}`} color="yellow.300" fontWeight="700">
          {buf}
        </Box>
      ) : (
        <React.Fragment key={`p-${parts.length}`}>{buf}</React.Fragment>
      ),
    );
  }
  return parts;
}

// Fixed-width "icon value" pill used for inline stats. Rendered in the same
// column slot for every row of a given type so the eye can scan straight down.
// Highlights orange when its field is being filtered/sorted on.
const PILL_WIDTH = '46px';
const StatPill: React.FC<{
  icon: IconType;
  value: number | string | null | undefined;
  highlighted?: boolean;
  title?: string;
}> = ({ icon, value, highlighted, title }) => {
  const present = value != null && value !== '';
  return (
    <HStack
      spacing={1}
      px={1.5}
      py={0.5}
      borderRadius="sm"
      bg={highlighted ? 'orange.700' : 'gray.700'}
      fontSize="xs"
      fontFamily="mono"
      minW={PILL_WIDTH}
      justify="center"
      title={title}
      opacity={present ? 1 : 0.4}
    >
      <Icon as={icon} boxSize={3} color={highlighted ? 'orange.100' : 'gray.300'} />
      <Text color="gray.50" fontWeight="bold">{present ? value : '—'}</Text>
    </HStack>
  );
};

// Map of canonical field name → icon, used for "extra" highlighted stats
// (characteristics or skills the user has filtered on that aren't in the
// default per-type stat columns).
const FIELD_ICON: Record<string, IconType> = {
  soak: FiShield,
  wounds: FiHeart,
  strain: FiActivity,
  brawn: FiActivity,
  agility: FiActivity,
  intellect: FiActivity,
  cunning: FiActivity,
  willpower: FiActivity,
  presence: FiActivity,
  damage: FiTarget,
  crit: FiAlertTriangle,
};

// Adversary tier badge — coloured by tier so Minion / Rival / Nemesis pop visually.
const TierBadge: React.FC<{ tier?: string }> = ({ tier }) => {
  if (!tier) return null;
  const color =
    tier === 'Minion' ? 'gray' : tier === 'Rival' ? 'blue' : tier === 'Nemesis' ? 'red' : 'purple';
  return (
    <Badge colorScheme={color} variant="solid" fontSize="0.65rem" textTransform="uppercase">
      {tier}
    </Badge>
  );
};

// Walk a dotted-or-array field path on an object.
function getPath(obj: any, path: string[]): any {
  let cur = obj;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

// Build the "extra" pills the user has explicitly filtered/sorted on, beyond
// the per-type defaults. Lets `brawn:>=3` add a Brawn pill to every adversary
// row alongside the standard soak / wounds / strain trio.
function extraPills(detail: any, highlighted: Set<string>, defaultsAlreadyShown: string[]): Array<{ key: string; icon: IconType; value: number | string }> {
  const out: Array<{ key: string; icon: IconType; value: number | string }> = [];
  const skip = new Set(defaultsAlreadyShown);
  // Aliased forms of defaults map to the same canonical field; skip those too.
  for (const a of ['hp', 'wt', 'st']) skip.add(a);
  for (const fname of highlighted) {
    const def = lookupField(fname);
    if (!def || def.kind !== 'numeric' || !def.detailPath) continue;
    if (skip.has(def.name)) continue;
    const v = getPath(detail, def.detailPath);
    if (v == null) continue;
    out.push({ key: def.name, icon: FIELD_ICON[def.name] || FiActivity, value: v });
  }
  return out;
}

const SpotlightResultRow: React.FC<SpotlightResultRowProps> = ({
  r,
  idx,
  isSelected,
  onHoverIndex,
  onClickResult,
  rowHeight,
  highlightedFields,
  rowHoverBg = 'gray.600',
  rowSelectedBg = 'gray.700',
}) => {
  // Fetch detail lazily for lightweight results (searchIndex omits detail).
  const detail = React.useMemo(() => getDetail(r.type, r.id), [r.type, r.id]);
  const hl = highlightedFields ?? new Set<string>();

  let trailing: React.ReactNode = null;
  let subtitleLine: React.ReactNode = null;

  if (r.type === 'adversary') {
    const derived = (detail as any)?.derived || {};
    const tier = (detail as any)?.adversaryType ?? r.subtitle;
    // Default rows show "tier · archetype" — gives the GM a quick read of
    // role + tier without numeric noise. When the user has any numeric
    // filter/sort active, those specific stats appear after the badges so the
    // relevant value stays visible. Pure characteristics/skills (brawn, brawl)
    // still stack on as extras when the user has filtered on them.
    const archetypes: string[] = Array.isArray((detail as any)?.archetypes)
      ? (detail as any).archetypes
      : [];
    const archetypeLabel = archetypes[0];
    const numericPills: React.ReactNode[] = [];
    if (hl.has('soak') && derived.soak != null) {
      numericPills.push(
        <StatPill key="soak" icon={FiShield} value={derived.soak} highlighted title="Soak" />,
      );
    }
    if ((hl.has('wounds') || hl.has('hp') || hl.has('wt')) && derived.wounds != null) {
      numericPills.push(
        <StatPill key="wounds" icon={FiHeart} value={derived.wounds} highlighted title="Wound threshold" />,
      );
    }
    if ((hl.has('strain') || hl.has('st')) && derived.strain != null) {
      numericPills.push(
        <StatPill key="strain" icon={FiActivity} value={derived.strain} highlighted title="Strain threshold" />,
      );
    }
    const extras = extraPills(detail, hl, ['soak', 'wounds', 'strain']);
    trailing = (
      <HStack spacing={1.5} align="center">
        <TierBadge tier={tier} />
        {archetypeLabel && (
          <Badge colorScheme="cyan" variant="subtle" fontSize="0.65rem" textTransform="uppercase">
            {archetypeLabel}
          </Badge>
        )}
        {numericPills}
        {extras.map((e) => (
          <StatPill key={e.key} icon={e.icon} value={e.value} highlighted title={e.key} />
        ))}
      </HStack>
    );
  } else if (r.type === 'weapon') {
    trailing = (
      <HStack spacing={1.5} align="center">
        <Badge colorScheme="purple" variant="outline" fontSize="0.65rem" textTransform="uppercase">
          weapon
        </Badge>
        <StatPill icon={FiTarget} value={detail?.damage} highlighted={hl.has('damage')} title="Damage" />
        <StatPill icon={FiAlertTriangle} value={detail?.crit} highlighted={hl.has('crit')} title="Crit" />
        <StatPill icon={FiCompass} value={detail?.range} title="Range" />
      </HStack>
    );
    if (r.subtitle) {
      subtitleLine = (
        <Text fontSize="sm" color="gray.400" noOfLines={1}>
          {r.subtitle}
        </Text>
      );
    }
  } else {
    trailing = (
      <Badge colorScheme="purple" variant="outline" fontSize="0.65rem" textTransform="uppercase">
        {r.type}
      </Badge>
    );
    if (r.subtitle) {
      subtitleLine = (
        <Text fontSize="sm" color="gray.400" noOfLines={1}>
          {r.subtitle}
        </Text>
      );
    } else if (detail?.category) {
      subtitleLine = (
        <Text fontSize="sm" color="gray.400" noOfLines={1}>
          {detail.category}
        </Text>
      );
    }
  }

  return (
    <HStack
      key={`${r.type}:${r.id}`}
      onMouseEnter={() => onHoverIndex(idx)}
      onClick={() => onClickResult(r)}
      px={4}
      height={`${rowHeight}px`}
      spacing={3}
      cursor="pointer"
      bg={isSelected ? rowSelectedBg : 'transparent'}
      _hover={{ bg: rowHoverBg }}
      borderLeftWidth="3px"
      borderLeftColor={isSelected ? 'purple.400' : 'transparent'}
      transition="background 120ms ease, border-color 120ms ease"
    >
      <Box flex="1" minW={0}>
        <Text fontWeight="semibold" color="gray.100" noOfLines={1}>
          {renderHighlighted(r.name, r.matches)}
        </Text>
        {subtitleLine}
      </Box>
      {trailing}
    </HStack>
  );
};

export default SpotlightResultRow;

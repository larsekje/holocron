import React from 'react';
import { Badge, Box, HStack, Text } from '@chakra-ui/react';
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

// Compact "label value" pill, used for inline stats. Highlights when its label
// is being filtered/sorted on so the user can spot the relevant number.
const StatPill: React.FC<{ label: string; value: number | string; highlighted?: boolean }> = ({
  label,
  value,
  highlighted,
}) => (
  <HStack
    spacing={1}
    px={1.5}
    py={0.5}
    borderRadius="sm"
    bg={highlighted ? 'orange.700' : 'gray.700'}
    fontSize="xs"
    fontFamily="mono"
  >
    <Text color={highlighted ? 'orange.100' : 'gray.400'}>{label}</Text>
    <Text color="gray.50" fontWeight="bold">{value}</Text>
  </HStack>
);

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

// For an adversary, build the stat pills shown on the row. Always shows the
// core derived stats (soak / wounds / strain), plus any other field that's
// currently being filtered/sorted on, to keep the relevant value visible
// without cluttering rows with all 6 characteristics.
function adversaryStats(detail: any, highlighted: Set<string>): Array<{ label: string; value: number | string; highlighted?: boolean }> {
  const out: Array<{ label: string; value: number | string; highlighted?: boolean }> = [];
  const derived = detail?.derived || {};
  if (derived.soak != null) {
    out.push({ label: 'soak', value: derived.soak, highlighted: highlighted.has('soak') });
  }
  if (derived.wounds != null) {
    out.push({
      label: 'w',
      value: derived.wounds,
      highlighted: highlighted.has('wounds') || highlighted.has('hp') || highlighted.has('wt'),
    });
  }
  if (derived.strain != null) {
    out.push({
      label: 'str',
      value: derived.strain,
      highlighted: highlighted.has('strain') || highlighted.has('st'),
    });
  }
  // Any extra highlighted field the user has filtered by — show its value too,
  // even if it's a characteristic or a skill. Skip the ones we already showed.
  const alreadyShown = new Set(['soak', 'wounds', 'strain']);
  for (const fname of highlighted) {
    if (alreadyShown.has(fname)) continue;
    const def = lookupField(fname);
    if (!def || def.kind !== 'numeric' || !def.detailPath) continue;
    const v = getPath(detail, def.detailPath);
    if (v == null) continue;
    // Use the canonical name for the label so aliases (br/ag/...) all show their
    // canonical form.
    out.push({ label: def.name, value: v, highlighted: true });
  }
  return out;
}

// For weapons, show damage / crit / range; highlight when those fields are queried.
function weaponStats(detail: any, highlighted: Set<string>): Array<{ label: string; value: number | string; highlighted?: boolean }> {
  const out: Array<{ label: string; value: number | string; highlighted?: boolean }> = [];
  if (detail?.damage != null) out.push({ label: 'dmg', value: detail.damage, highlighted: highlighted.has('damage') });
  if (detail?.crit != null) out.push({ label: 'crit', value: detail.crit, highlighted: highlighted.has('crit') });
  if (detail?.range) out.push({ label: 'rng', value: String(detail.range) });
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
    const tier = (detail as any)?.adversaryType ?? r.subtitle;
    const stats = adversaryStats(detail, hl);
    trailing = (
      <HStack spacing={1.5} align="center">
        <TierBadge tier={tier} />
        {stats.map((s) => (
          <StatPill key={s.label} label={s.label} value={s.value} highlighted={s.highlighted} />
        ))}
      </HStack>
    );
  } else if (r.type === 'weapon') {
    const stats = weaponStats(detail, hl);
    trailing = (
      <HStack spacing={1.5} align="center">
        <Badge colorScheme="purple" variant="outline" fontSize="0.65rem" textTransform="uppercase">
          weapon
        </Badge>
        {stats.map((s) => (
          <StatPill key={s.label} label={s.label} value={s.value} highlighted={s.highlighted} />
        ))}
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

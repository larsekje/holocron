import React from 'react';
import { Badge, Box, HStack, Icon, Text, Tooltip } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertTriangle,
  FiCompass,
  FiHeart,
  FiShield,
  FiTarget,
} from 'react-icons/fi';
import { ReactComponent as SetbackDie } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultyDie } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeDie } from '@/assets/dice/challenge.svg';
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

// Short descriptor for each adversary archetype, shown in the row tooltip so
// the GM doesn't have to remember what each label means. Keys are normalised
// (lowercase, plain hyphen) so unicode hyphens like "Force‑User" still match.
const ARCHETYPE_DESCRIPTOR: Record<string, string> = {
  shooter: 'precise ranged combatant',
  bruiser: 'brute-force melee fighter',
  scout: 'stealthy survey / recon',
  social: 'charm, persuasion, manipulation',
  leader: 'commands and inspires others',
  'beast/creature': 'natural predator or monstrous threat',
  droid: 'robotic / mechanical NPC',
  operative: 'covert infiltrator or assassin',
  pilot: 'starship or vehicle ace',
  tech: 'slicer, engineer, or remote operator',
  'force-user': 'Force-sensitive caster or duellist',
  security: 'guard, sentry, enforcer',
  medic: 'healer or field medic',
};

const archetypeKey = (s: string) =>
  s.toLowerCase().replace(/[‐-―]/g, '-').trim();

// One-line descriptors for the v4.2 `coreArchetype` taxonomy (single canonical
// archetype per adversary). Mirrors `references/archetypes.md`.
const CORE_ARCHETYPE_DESCRIPTOR: Record<string, string> = {
  gunslinger: 'agile blaster duelist',
  marksman: 'precision long-range shooter',
  'heavy hitter': 'brute force / heavy weapons',
  'melee bruiser': 'non-Force close-combat specialist',
  'ace pilot': 'starship / vehicle specialist',
  soldier: 'front-line battlefield trooper',
  enforcer: 'armed civil/local-law muscle',
  grunt: 'low-tier humanoid rabble',
  'guns for hire': 'paid mercenary / freelance bounty hunter',
  'persistent pest': 'numerous low-threat creatures (swarms)',
  critter: 'solo or small-group ambient creature',
  'nasty beast': 'apex predator or strong pack creature',
  'mount / beast of burden': 'trained working / riding beast',
  technician: 'engineer, mechanic, slicer, medic, utility',
  commander: 'battlefield leader, coordinates troops',
  'shadow operative': 'stealth, infiltration, assassin',
  'force duelist': 'lightsaber / Force-melee combatant',
  'force savant': 'non-melee Force combatant (control / ranged)',
  'force adept': 'support Force user (heal / foresee / buff)',
  sycophant: 'obedient yes-man / attendant',
  'smooth talker': 'charm, persuasion, con artist',
  bureaucrat: 'paperwork authority, official functionary',
  fixer: 'middleman, broker, info trader',
  schemer: 'covert manipulator',
  'power broker': 'open authority over resources / networks',
  kingpin: 'underworld leader / crime boss',
  socialite: 'high-status charmer with elite connections',
  mentor: 'trainer / advisor (Force or non-Force)',
  mystic: 'devotional / cultic figure (Force or non-Force)',
  civilian: 'non-combat humanoid / droid bystander',
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

// Fixed width for the trailing type badge so adversary / weapon / rule rows
// line their badges up vertically.
const TYPE_BADGE_WIDTH = '72px';

// Adversary tier → narrative die, mirroring AdversaryTypeBadge: Minion →
// Setback, Rival → Difficulty, Nemesis → Challenge. The leading-slot die
// carries the tier now, so adversary rows no longer need a separate tier chip.
const TIER_DIE: Record<string, typeof SetbackDie> = {
  Minion: SetbackDie,
  Rival: DifficultyDie,
  Nemesis: ChallengeDie,
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

  // Clout sits in a leading slot (before the name) on every adversary row, so
  // we hoist it out of the per-type branch below. The slot's die also encodes
  // the tier (Minion/Rival/Nemesis), which is why there's no separate tier chip.
  const clout =
    r.type === 'adversary' && typeof (detail as any)?.clout === 'number'
      ? ((detail as any).clout as number)
      : null;
  const tier: string | undefined =
    r.type === 'adversary' ? ((detail as any)?.adversaryType ?? r.subtitle) : undefined;
  const tierDie =
    r.type === 'adversary' ? TIER_DIE[tier ?? ''] ?? SetbackDie : null;

  let trailing: React.ReactNode = null;
  let subtitleLine: React.ReactNode = null;

  if (r.type === 'adversary') {
    const derived = (detail as any)?.derived || {};
    // Default rows show "tier · archetype" — gives the GM a quick read of
    // role + tier without numeric noise. When the user has any numeric
    // filter/sort active, those specific stats appear after the badges so the
    // relevant value stays visible. Pure characteristics/skills (brawn, brawl)
    // still stack on as extras when the user has filtered on them.
    const archetype: string | undefined =
      typeof (detail as any)?.archetype === 'string' ? (detail as any).archetype : undefined;
    const factions: string[] = Array.isArray((detail as any)?.factions)
      ? (detail as any).factions
      : [];
    const traits: string[] = Array.isArray((detail as any)?.traits)
      ? (detail as any).traits
      : [];
    const coreArchetype: string | undefined =
      typeof (detail as any)?.coreArchetype === 'string' && (detail as any).coreArchetype
        ? (detail as any).coreArchetype
        : undefined;
    // The badge displays the v4.2 coreArchetype (single canonical role) when
    // present; falls back to the source archetype list's first entry. The
    // tooltip lists both so the GM can compare role vs source classification.
    const archetypeLabel = coreArchetype ?? archetype;
    const coreDesc = coreArchetype
      ? CORE_ARCHETYPE_DESCRIPTOR[archetypeKey(coreArchetype)]
      : undefined;
    const archetypeTooltip = (
      <Box>
        {coreArchetype && (
          <Text fontSize="xs" mb={(!!archetype || factions.length > 0 || traits.length > 0) ? 1.5 : 0}>
            <Text as="span" fontWeight="bold" color="cyan.200">{coreArchetype}</Text>
            {coreDesc && <Text as="span" color="gray.400"> — {coreDesc}</Text>}
          </Text>
        )}
        {archetype && (
          <Text fontSize="xs" mb={(factions.length > 0 || traits.length > 0) ? 1.5 : 0}>
            <Text as="span" color="gray.500">Archetype: </Text>
            <Text as="span" color="gray.300">{archetype}</Text>
          </Text>
        )}
        {factions.length > 0 && (
          <Text fontSize="xs">
            <Text as="span" color="gray.400">Factions: </Text>
            {factions.join(' · ')}
          </Text>
        )}
        {traits.length > 0 && (
          <Text fontSize="xs">
            <Text as="span" color="gray.400">Traits: </Text>
            {traits.join(' · ')}
          </Text>
        )}
      </Box>
    );
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
    const extras = extraPills(detail, hl, ['soak', 'wounds', 'strain', 'clout']);
    trailing = (
      <HStack spacing={1.5} align="center">
        {archetypeLabel && (
          <Tooltip label={archetypeTooltip} placement="top" hasArrow openDelay={200} bg="gray.900" color="gray.100">
            <Badge
              bg="whiteAlpha.100"
              color="gray.400"
              fontSize="0.65rem"
              textTransform="uppercase"
            >
              {archetypeLabel}
            </Badge>
          </Tooltip>
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
        <StatPill icon={FiTarget} value={detail?.damage} highlighted={hl.has('damage')} title="Damage" />
        <StatPill icon={FiAlertTriangle} value={detail?.crit} highlighted={hl.has('crit')} title="Crit" />
        <StatPill icon={FiCompass} value={detail?.range} title="Range" />
        <Badge
          colorScheme="purple"
          variant="outline"
          fontSize="0.65rem"
          textTransform="uppercase"
          minW={TYPE_BADGE_WIDTH}
          textAlign="center"
        >
          weapon
        </Badge>
      </HStack>
    );
    if (r.subtitle) {
      subtitleLine = (
        <Text fontSize="xs" color="gray.400" noOfLines={1}>
          {r.subtitle}
        </Text>
      );
    }
  } else {
    trailing = (
      <Badge
        colorScheme="purple"
        variant="outline"
        fontSize="0.65rem"
        textTransform="uppercase"
        minW={TYPE_BADGE_WIDTH}
        textAlign="center"
      >
        {r.type}
      </Badge>
    );
    if (r.subtitle) {
      subtitleLine = (
        <Text fontSize="xs" color="gray.400" noOfLines={1}>
          {r.subtitle}
        </Text>
      );
    } else if (detail?.category) {
      subtitleLine = (
        <Text fontSize="xs" color="gray.400" noOfLines={1}>
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
      px={3}
      height={`${rowHeight}px`}
      spacing={2.5}
      cursor="pointer"
      bg={isSelected ? rowSelectedBg : 'transparent'}
      _hover={{ bg: rowHoverBg }}
      borderLeftWidth="3px"
      borderLeftColor={isSelected ? 'purple.400' : 'transparent'}
      transition="background 120ms ease, border-color 120ms ease"
    >
      {tierDie ? (
        <Box
          position="relative"
          w="24px"
          h="24px"
          flexShrink={0}
          opacity={0.85}
          title={clout != null ? `${tier} · Clout ${clout}` : tier}
          aria-label={clout != null ? `${tier}, Clout ${clout}` : tier}
        >
          <Icon as={tierDie} boxSize="24px" display="block" aria-hidden />
          {clout != null && (
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -55%)"
              color="white"
              fontWeight="semibold"
              fontSize="0.7rem"
              lineHeight="1"
              userSelect="none"
            >
              {clout}
            </Text>
          )}
        </Box>
      ) : null}
      <Box flex="1" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.100" noOfLines={1}>
          {renderHighlighted(r.name, r.matches)}
        </Text>
        {subtitleLine}
      </Box>
      {trailing}
    </HStack>
  );
};

// Memoized: when only one row's `isSelected` flips, the other ~200 rows should not re-render.
export default React.memo(SpotlightResultRow);

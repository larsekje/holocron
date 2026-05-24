import React from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  HStack,
  Select,
  Tag,
  Text,
  Textarea,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import type { SpotlightDetail } from '@/state/spotlightStore';
import {
  CLASSIFICATION_FIELDS,
  type ClassificationField,
  type ClassificationFlag,
} from '@/state/classificationReviewStore';
import {
  CORE_ARCHETYPE_NAMES,
  describeArchetypeBucket,
  describeCoreArchetype,
  describeFaction,
  describeProfile,
} from '@/data/archetypeDescriptions';

// Right pane: the full picture for one adversary — its four classification
// fields (with descriptions), the v4.2 rationale, a compact stat readout to
// judge correctness against, and the flag controls.

interface Props {
  adversary: SpotlightDetail | null;
  flag: ClassificationFlag | undefined;
  onSetFlag: (id: string, flag: Omit<ClassificationFlag, 'flaggedAt'>) => void;
  onClearFlag: (id: string) => void;
}

const borderCol = 'gray.700';

const FIELD_LABEL: Record<ClassificationField, string> = {
  coreArchetype: 'Role',
  factions: 'Faction',
  traits: 'Profile',
};

function asNameList(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x : x?.name)).filter((s): s is string => !!s);
}

// One classification field rendered as a labelled chip row, with describe()
// tooltips where a descriptor exists.
const FieldRow: React.FC<{
  label: string;
  values: string[];
  describe?: (name: string) => string | undefined;
  warnUnknown?: boolean; // mark values with no descriptor (likely off-taxonomy)
}> = ({ label, values, describe, warnUnknown }) => (
  <Box>
    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="gray.500" mb={1}>
      {label}
    </Text>
    {values.length === 0 ? (
      <Text fontSize="sm" color="orange.300">
        — none —
      </Text>
    ) : (
      <Wrap spacing={1.5} shouldWrapChildren>
        {values.map((v) => {
          const desc = describe?.(v);
          const unknown = warnUnknown && !desc;
          const chip = (
            <Tag size="sm" variant="subtle" colorScheme={unknown ? 'orange' : 'gray'}>
              {v}
              {unknown && <Text as="span" ml={1} fontSize="0.6rem" opacity={0.8}>(off-taxonomy?)</Text>}
            </Tag>
          );
          return (
            <WrapItem key={v}>
              {desc ? (
                <Tooltip label={desc} placement="top" hasArrow openDelay={200} bg="gray.900" color="gray.100">
                  {chip}
                </Tooltip>
              ) : (
                chip
              )}
            </WrapItem>
          );
        })}
      </Wrap>
    )}
  </Box>
);

const StatReadout: React.FC<{ detail: any }> = ({ detail }) => {
  const chars = detail.characteristics ?? {};
  const derived = detail.derived ?? {};
  const skills = Object.entries(detail.skills ?? {})
    .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
    .map(([k, v]) => `${k.replace(/^Knowledge:\s+/, '')} ${v}`);
  const talents = asNameList(detail.talents);
  const abilities = asNameList(detail.abilities);
  const weapons = asNameList(detail.weapons);

  const charOrder: Array<[string, string]> = [
    ['BR', 'Brawn'],
    ['AG', 'Agility'],
    ['INT', 'Intellect'],
    ['CUN', 'Cunning'],
    ['WIL', 'Willpower'],
    ['PR', 'Presence'],
  ];

  const Line: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Box>
      <Text as="span" fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" mr={2}>
        {label}
      </Text>
      <Text as="span" fontSize="sm" color="gray.300">
        {children}
      </Text>
    </Box>
  );

  return (
    <VStack align="stretch" spacing={1.5}>
      <HStack spacing={3} fontFamily="mono">
        {charOrder.map(([abbr, full]) => (
          <HStack key={abbr} spacing={1}>
            <Text fontSize="xs" color="gray.500">
              {abbr}
            </Text>
            <Text fontSize="sm" color="gray.200" fontWeight="bold">
              {chars[full] ?? '–'}
            </Text>
          </HStack>
        ))}
      </HStack>
      <Line label="Soak/W/St">
        {derived.soak ?? '–'} / {derived.wounds ?? '–'} / {derived.strain ?? '–'}
      </Line>
      {skills.length > 0 && <Line label="Skills">{skills.join(', ')}</Line>}
      {talents.length > 0 && <Line label="Talents">{talents.join(', ')}</Line>}
      {abilities.length > 0 && <Line label="Abilities">{abilities.join(', ')}</Line>}
      {weapons.length > 0 && <Line label="Weapons">{weapons.join(', ')}</Line>}
    </VStack>
  );
};

const ClassificationReviewDetail: React.FC<Props> = ({ adversary, flag, onSetFlag, onClearFlag }) => {
  // Flag-form local state, reset whenever the selected adversary changes.
  const [note, setNote] = React.useState('');
  const [fields, setFields] = React.useState<ClassificationField[]>([]);
  const [suggested, setSuggested] = React.useState('');

  React.useEffect(() => {
    setNote(flag?.note ?? '');
    setFields(flag?.fields ?? []);
    setSuggested(flag?.suggestedCoreArchetype ?? '');
    // Re-sync only when the selected adversary changes (not on every flag edit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adversary?.id]);

  if (!adversary) {
    return (
      <Box p={6}>
        <Text fontSize="sm" color="gray.500">
          Select an adversary to review its classification.
        </Text>
      </Box>
    );
  }

  const d = adversary as any;
  const tier: string = d.adversaryType ?? '';
  const reason: string | undefined = d.classificationReason;
  const coreArchetype: string = d.coreArchetype ?? '';

  const canSave = note.trim().length > 0 || fields.length > 0 || suggested.length > 0;
  const isFlagged = !!flag;

  const handleSave = () => {
    if (!canSave) return;
    onSetFlag(adversary.id, {
      name: adversary.name,
      note: note.trim(),
      fields: fields.length > 0 ? fields : undefined,
      suggestedCoreArchetype: suggested || undefined,
    });
  };

  return (
    <Box p={4}>
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold" color="gray.100">
            {adversary.name}
          </Text>
          <HStack spacing={2}>
            {isFlagged && (
              <Badge colorScheme="orange" variant="subtle">
                Flagged
              </Badge>
            )}
            {tier && (
              <Badge colorScheme="purple" variant="subtle">
                {tier}
              </Badge>
            )}
          </HStack>
        </HStack>

        {/* Classification fields */}
        <VStack align="stretch" spacing={3}>
          <FieldRow
            label={FIELD_LABEL.coreArchetype}
            values={coreArchetype ? [coreArchetype] : []}
            describe={describeCoreArchetype}
            warnUnknown
          />
          <FieldRow label="Archetype" values={d.archetype ? [d.archetype] : []} describe={describeArchetypeBucket} />
          <FieldRow label={FIELD_LABEL.factions} values={asNameList(d.factions)} describe={describeFaction} />
          <FieldRow label={FIELD_LABEL.traits} values={asNameList(d.traits)} describe={describeProfile} />
        </VStack>

        {/* v4.2 rationale */}
        <Box bg="#1f2226" borderWidth="1px" borderColor={borderCol} borderRadius="md" px={3} py={2}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="gray.500" mb={1}>
            v4.2 rationale
          </Text>
          {reason ? (
            <Text fontSize="sm" color="gray.300">
              {reason}
            </Text>
          ) : (
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
              No v4.2 rationale on file for this adversary.
            </Text>
          )}
        </Box>

        {/* Stat readout — context to judge the classification against */}
        <Box>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="gray.500" mb={1.5}>
            Stat block
          </Text>
          <StatReadout detail={d} />
        </Box>

        <Divider borderColor={borderCol} />

        {/* Flag controls */}
        <VStack align="stretch" spacing={2.5}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="gray.500">
            Flag this classification
          </Text>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Which field(s) look wrong?
            </Text>
            <CheckboxGroup
              value={fields}
              onChange={(v) => setFields(v as ClassificationField[])}
            >
              <Wrap spacing={3}>
                {CLASSIFICATION_FIELDS.map((f) => (
                  <WrapItem key={f}>
                    <Checkbox value={f} size="sm" colorScheme="orange">
                      <Text fontSize="sm" color="gray.200">{FIELD_LABEL[f]}</Text>
                    </Checkbox>
                  </WrapItem>
                ))}
              </Wrap>
            </CheckboxGroup>
          </Box>
          <Textarea
            size="sm"
            rows={3}
            placeholder="What's wrong, and what it should be — this feeds the taxonomy revision pass."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            bg="#1f2226"
            borderColor={borderCol}
            color="gray.100"
            _placeholder={{ color: 'gray.500' }}
          />
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Suggested core archetype (optional)
            </Text>
            <Select
              size="sm"
              maxW="240px"
              value={suggested}
              onChange={(e) => setSuggested(e.target.value)}
              bg="#1f2226"
              borderColor={borderCol}
              color="gray.100"
              sx={{ option: { background: '#1f2226', color: '#e2e8f0' } }}
            >
              <option value="">— no suggestion —</option>
              {CORE_ARCHETYPE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Box>
          <HStack spacing={2}>
            <Button size="sm" colorScheme="orange" onClick={handleSave} isDisabled={!canSave}>
              {isFlagged ? 'Update flag' : 'Save flag'}
            </Button>
            {isFlagged && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => onClearFlag(adversary.id)}
              >
                Remove flag
              </Button>
            )}
            {flag && (
              <Text fontSize="xs" color="gray.600">
                flagged {flag.flaggedAt.slice(0, 10)}
              </Text>
            )}
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default ClassificationReviewDetail;

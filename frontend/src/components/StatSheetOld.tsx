import React, {useState} from "react";
import {Box, Button, Collapse, Divider, Flex, Heading, HStack, IconButton, Text, Tooltip, VStack, Wrap, WrapItem} from "@chakra-ui/react";
import {FaRocket} from "react-icons/fa";
import {FiLink} from "react-icons/fi";
import {ChevronDownIcon, ChevronUpIcon} from "@chakra-ui/icons";
import type {CharacteristicSet} from "@components/statblock/CharacteristicsOld";
import SkillListOld from "@components/statblock/SkillListOld";
import WeaponListOld from "@components/statblock/WeaponListOld";
import StatusCardOld from "@components/statuscard/StatusCardOld";
import AttachVehicleModal from "@components/vehicle/AttachVehicleModal";
import AdversaryTypeBadgeOld from "@components/target/AdversaryTypeBadgeOld";
import SourcesOld from "@components/statblock/SourcesOld";
import {isSourceTag} from "@/utils/statify";
import useParticipantStore from "@/state/participantsStore";
import {Participant} from "@/state/participantsStore";
import {statify} from "@/utils/statify";
import {talentNames} from "@/utils/talents";
import {getDetail} from "@/data/spotlightIndex";
import abilitiesData from "@/assets/data/talents/abilities.json";
import {describeArchetypeBucket, describeCoreArchetype, describeFaction} from "@/data/archetypeDescriptions";
import SwrpgTooltip from "@components/common/SwrpgTooltip";
import {renderSwrpgText} from "@/utils/swrpgText";

interface Props {
  participant?: Participant | null;
}

function talentSlugFromName(name: string): string {
  const stripped = name.replace(/\s+\d+$/, "").trim();
  return (
    "talent_" +
    stripped
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function lookupTalentDescription(name: string): string | undefined {
  const id = talentSlugFromName(name);
  const detail = getDetail("talent", id);
  return (detail as any)?.description;
}

// Adversary "abilities" reach the UI in two shapes: a bare string, or an
// object ({ name, description }) — d20radio.json and similar carry the rules
// text inline. Curated descriptions for the bare-string form live only in this
// hand-curated file. Match case-insensitively, falling back to a rank-digit-
// stripped key so "Silhouette 3" finds "Silhouette".
const abilityDescByName: Map<string, string> = new Map(
  (abilitiesData as Array<{name: string; description: string}>).map((a) => [
    a.name.trim().toLowerCase(),
    a.description,
  ]),
);

function lookupAbilityDescription(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  const stripped = key.replace(/\s+\d+$/, "");
  return abilityDescByName.get(key) ?? abilityDescByName.get(stripped);
}

// Normalise a (possibly mixed) abilities array to { name, description } —
// preferring an inline description, then the curated lookup.
function normaliseAbilities(raw: unknown): Array<{name: string; description?: string}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): {name: string; description?: string} | null => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        return name ? {name, description: lookupAbilityDescription(name)} : null;
      }
      if (entry && typeof entry === 'object') {
        const o = entry as Record<string, unknown>;
        const name = typeof o.name === 'string' ? o.name.trim() : '';
        if (!name) return null;
        const description =
          typeof o.description === 'string' && o.description.trim()
            ? o.description
            : lookupAbilityDescription(name);
        return {name, description};
      }
      return null;
    })
    .filter((a): a is {name: string; description?: string} => a !== null);
}

function adversarySlug(name: string): string {
  return (
    "adversary_" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function lookupAdversaryDetail(participant: {name: string; stats?: any}): Record<string, any> | null {
  const lookupName = participant.stats?.adversaryId ?? participant.name;
  const detail = getDetail("adversary", adversarySlug(lookupName));
  return (detail as any) ?? null;
}

const StatSheetOld = ({participant}: Props) => {
  const [currentCharacteristic, setCurrentCharacteristic] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const setStat = useParticipantStore((s) => s.setStat);

  if (!participant) {
    return <Text color="white">Nothing selected</Text>;
  }

  const stats = participant.stats || {};
  const characteristics: CharacteristicSet = {
    brawn: stats.brawn ?? 2,
    agility: stats.agility ?? 2,
    intellect: stats.intellect ?? 2,
    cunning: stats.cunning ?? 2,
    willpower: stats.willpower ?? 2,
    presence: stats.presence ?? 2,
  };

  const tags: string[] = (stats as any).tags ?? [];
  const type = stats.type ?? (participant.isPC ? "PC" : "Minion");
  const talents: string[] = talentNames(stats.talents);
  const abilities = normaliseAbilities((stats as any).abilities);
  const gear: string[] = (stats as any).gear ?? (stats as any).weapons ?? [];
  const adversaryDetail = lookupAdversaryDetail(participant);
  // The stat block this character is built on — shown beside a custom name so the
  // GM can see e.g. "Captain Vree Sall" *is* a Gang leader.
  const sourceName = participant.originalName ?? (adversaryDetail?.name as string | undefined);
  // Description: prefer the participant's own stats, fall back to the indexed
  // adversary detail so the sheet still shows flavour text for participants
  // whose stats predate the description being carried.
  const description: string = (stats as any).description ?? adversaryDetail?.description ?? "";
  const skills: Record<string, number> = stats.skills ?? {};

  // Minion group accounting (per SWRPG rules):
  // wound threshold stored is per-minion; group pool = perMin × initialMinions;
  // alive minions decrement once total wounds passes a multiple of the per-min threshold.
  const initialMinions = stats.minions;
  const perMinionThreshold = stats.woundThreshold ?? 0;
  const woundsTaken = stats.wounds ?? 0;
  const aliveMinions =
    initialMinions !== undefined && perMinionThreshold > 0
      ? Math.max(initialMinions - Math.floor(woundsTaken / perMinionThreshold), 0)
      : undefined;

  // Subtitle: Spotlight-derived classification — Role (coreArchetype) + the
  // derived Archetype bucket. Fall back to type + non-provenance tags if no detail.
  const coreArchetype = adversaryDetail?.coreArchetype as string | undefined;
  const archetype = adversaryDetail?.archetype as string | undefined;
  const factions = (adversaryDetail?.factions as string[] | undefined) ?? [];

  const fallbackTags = tags.filter((t) => !isSourceTag(t));
  const hasArchetypeData = !!coreArchetype || !!archetype;
  // Inline label that opens a SWRPG tooltip when a description is available.
  const renderTooltipChip = (
    label: string,
    description?: string,
    {italic = true, dim = false}: {italic?: boolean; dim?: boolean} = {},
  ) => {
    const trigger = (
      <Text
        as={italic ? "i" : "span"}
        fontSize={dim ? "xs" : "sm"}
        color={dim ? "whiteAlpha.600" : "whiteAlpha.850"}
        textDecoration={description ? "underline dotted" : "none"}
        textDecorationColor="whiteAlpha.300"
        textUnderlineOffset="2px"
        cursor={description ? "pointer" : "default"}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    );
    return description ? (
      <SwrpgTooltip title={label} description={description}>
        {trigger}
      </SwrpgTooltip>
    ) : trigger;
  };

  return (
    <div>
      <HStack alignItems="center" spacing={3}>
        <Box w="32px" h="32px" flexShrink={0}>
          <AdversaryTypeBadgeOld type={type} isPC={participant.isPC} clout={adversaryDetail?.clout}/>
        </Box>
        <VStack alignItems="flex-start" spacing={0} flex="1" minW={0} mr={2}>
          <HStack spacing={2} align="baseline" wrap="wrap">
            <Heading size="md" color="white">{participant.name}</Heading>
            {sourceName && sourceName !== participant.name && (
              <HStack spacing={1} color="whiteAlpha.500" align="center" minW={0}>
                <Box as="span" display="inline-flex" flexShrink={0}><FiLink size={11} /></Box>
                <Text fontSize="sm" fontStyle="italic" noOfLines={1}>{sourceName}</Text>
              </HStack>
            )}
            <SourcesOld tags={tags}/>
          </HStack>
          {hasArchetypeData ? (
            <HStack spacing={1.5} fontSize="sm" color="whiteAlpha.800" wrap="wrap">
              {coreArchetype && renderTooltipChip(
                coreArchetype,
                describeCoreArchetype(coreArchetype) ?? lookupTalentDescription(coreArchetype),
              )}
              {coreArchetype && archetype && (
                <Text color="whiteAlpha.400" fontSize="xs">·</Text>
              )}
              {archetype && renderTooltipChip(archetype, describeArchetypeBucket(archetype), {italic: false, dim: true})}
            </HStack>
          ) : (
            <Text color="whiteAlpha.800" as="i" fontSize="sm" noOfLines={1}>
              {[type, ...fallbackTags].filter(Boolean).join(", ")}
            </Text>
          )}
          {factions.length > 0 && (
            <HStack spacing={1.5} fontSize="xs" color="whiteAlpha.600" wrap="wrap" mt={0.5}>
              {factions.map((f, i) => (
                <React.Fragment key={f}>
                  {i > 0 && <Text color="whiteAlpha.300">·</Text>}
                  {renderTooltipChip(f, describeFaction(f), {italic: false, dim: true})}
                </React.Fragment>
              ))}
            </HStack>
          )}
        </VStack>
        {!participant.equippedVehicleId && (
          <Tooltip label="Attach a vehicle (pilot)" placement="left" hasArrow openDelay={300}>
            <IconButton
              aria-label="Attach vehicle"
              icon={<FaRocket/>}
              size="sm"
              variant="ghost"
              color="whiteAlpha.700"
              _hover={{bg: 'whiteAlpha.100', color: 'orange.300'}}
              flexShrink={0}
              onClick={() => setAttachOpen(true)}
            />
          </Tooltip>
        )}
      </HStack>

      <StatusCardOld participant={participant}/>

      <SkillListOld
        participant={participant}
        profileSkills={skills}
        characteristics={characteristics}
        currentCharacteristic={currentCharacteristic}
        setCurrentCharacteristic={setCurrentCharacteristic}
        onEditCharacteristic={(key, value) => setStat(participant.id, key, value)}
        aliveMinions={aliveMinions}
      />

      <WeaponListOld
        participant={participant}
        characteristics={characteristics}
        aliveMinions={aliveMinions}
      />

      {talents.length > 0 && (
        <>
          <SectionHeading>Talents</SectionHeading>
          <VStack align="stretch" spacing={1.5}>
            {talents.map((talentName, i) => {
              const ranked = talentName.match(/\s(\d+)$/);
              const ranks = ranked ? parseInt(ranked[1], 10) : 1;
              const rawDesc = lookupTalentDescription(talentName);
              const talentDesc = rawDesc ? statify(rawDesc, "", ranks) : "";
              return (
                <Text
                  key={`${talentName}-${i}`}
                  fontSize="sm"
                  color="whiteAlpha.900"
                  lineHeight="1.45"
                >
                  <Text as="span" fontWeight="bold">{talentName}</Text>
                  {talentDesc && (
                    <>
                      <Text as="span" color="whiteAlpha.500">{": "}</Text>
                      <Text as="span" color="whiteAlpha.800">{renderSwrpgText(talentDesc)}</Text>
                    </>
                  )}
                </Text>
              );
            })}
          </VStack>
        </>
      )}

      {abilities.length > 0 && (
        <>
          <SectionHeading>Special Abilities</SectionHeading>
          <VStack align="stretch" spacing={1.5}>
            {abilities.map((ability, i) => {
              const abilityDesc = ability.description
                ? statify(ability.description, "", 1)
                : "";
              return (
                <Text
                  key={`${ability.name}-${i}`}
                  fontSize="sm"
                  color="whiteAlpha.900"
                  lineHeight="1.45"
                >
                  <Text as="span" fontWeight="bold">{ability.name}</Text>
                  {abilityDesc && (
                    <>
                      <Text as="span" color="whiteAlpha.500">{": "}</Text>
                      <Text as="span" color="whiteAlpha.800">{renderSwrpgText(abilityDesc)}</Text>
                    </>
                  )}
                </Text>
              );
            })}
          </VStack>
        </>
      )}

      {gear.length > 0 && (
        <>
          <SectionHeading>Equipment</SectionHeading>
          <Text fontSize="sm" color="whiteAlpha.800" lineHeight="1.5">
            {gear.map((g, i) => (
              <React.Fragment key={`${g}-${i}`}>
                {i > 0 && <Text as="span" color="whiteAlpha.400">, </Text>}
                <Text as="span">{g}</Text>
              </React.Fragment>
            ))}
          </Text>
        </>
      )}

      {description && (
        <>
          <SectionHeading>Description</SectionHeading>
          <Box
            position="relative"
            maxH={descriptionExpanded ? "unset" : "4.5em"}
            overflow="hidden"
            cursor="pointer"
            onClick={() => setDescriptionExpanded((x) => !x)}
            transition="max-height 0.25s ease"
          >
            <Text color="white" fontSize="sm" whiteSpace="pre-line">
              {description}
            </Text>
            {!descriptionExpanded && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="2em"
                pointerEvents="none"
                bgGradient="linear(to-b, rgba(51,54,60,0), rgba(51,54,60,1))"
              />
            )}
          </Box>
        </>
      )}

      <AttachVehicleModal
        isOpen={attachOpen}
        onClose={() => setAttachOpen(false)}
        participant={participant}
      />
    </div>
  );
};

interface SectionHeadingProps {
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({children, trailing}) => (
  <Flex align="center" justify="space-between" mt={4} mb={1}>
    <Text
      as="b"
      fontSize="10px"
      letterSpacing="0.16em"
      textTransform="uppercase"
      color="#d39939"
    >
      {children}
    </Text>
    {trailing}
  </Flex>
);

export default StatSheetOld;

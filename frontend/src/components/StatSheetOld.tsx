import React, {useState} from "react";
import {Box, Button, Collapse, Divider, Flex, Heading, HStack, Text, Tooltip, VStack, Wrap, WrapItem} from "@chakra-ui/react";
import {ChevronDownIcon, ChevronUpIcon} from "@chakra-ui/icons";
import CharacteristicsOld from "@components/statblock/CharacteristicsOld";
import SkillListOld from "@components/statblock/SkillListOld";
import WeaponListOld from "@components/statblock/WeaponListOld";
import StatusCardOld from "@components/statuscard/StatusCardOld";
import AdversaryTypeBadgeOld from "@components/target/AdversaryTypeBadgeOld";
import SourcesOld from "@components/statblock/SourcesOld";
import {isSourceTag} from "@/utils/statify";
import useParticipantStore from "@/state/participantsStore";
import {Participant} from "@/state/participantsStore";
import {useEffectStore} from "@/state/effectStore";
import {statify} from "@/utils/statify";
import {getDetail} from "@/data/spotlightIndex";
import {describeArchetype, describeCoreArchetype, describeFaction} from "@/data/archetypeDescriptions";
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
  const setStat = useParticipantStore((s) => s.setStat);
  const allEffects = useEffectStore((s) => s.effects);

  if (!participant) {
    return <Text color="white">Nothing selected</Text>;
  }

  const statusEffects = allEffects.filter(
    (ae) => ae.target?.type === "character" && ae.target.participantId === participant.id,
  );

  const stats = participant.stats || {};
  const characteristics = {
    brawn: stats.brawn ?? 2,
    agility: stats.agility ?? 2,
    intellect: stats.intellect ?? 2,
    cunning: stats.cunning ?? 2,
    willpower: stats.willpower ?? 2,
    presence: stats.presence ?? 2,
  };

  const tags: string[] = (stats as any).tags ?? [];
  const type = stats.type ?? (participant.isPC ? "PC" : "Minion");
  const talents: string[] = stats.talents ?? [];
  const gear: string[] = (stats as any).gear ?? (stats as any).weapons ?? [];
  const description: string = (stats as any).description ?? "";
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

  // Subtitle: prefer the Spotlight-derived archetype info (coreArchetype + archetypes).
  // Fall back to type + non-provenance tags if no detail is found.
  const adversaryDetail = lookupAdversaryDetail(participant);
  const coreArchetype = adversaryDetail?.coreArchetype as string | undefined;
  const archetypes = (adversaryDetail?.archetypes as string[] | undefined) ?? [];
  const factions = (adversaryDetail?.factions as string[] | undefined) ?? [];

  const fallbackTags = tags.filter((t) => !isSourceTag(t));
  const hasArchetypeData = !!coreArchetype || archetypes.length > 0;
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
          <AdversaryTypeBadgeOld type={type} isPC={participant.isPC}/>
        </Box>
        <VStack alignItems="flex-start" spacing={0} flex="1" minW={0}>
          <HStack spacing={2} align="center">
            <Heading size="md" color="white">{participant.name}</Heading>
            <SourcesOld tags={tags}/>
          </HStack>
          {hasArchetypeData ? (
            <HStack spacing={1.5} fontSize="sm" color="whiteAlpha.800" wrap="wrap">
              {coreArchetype && renderTooltipChip(
                coreArchetype,
                describeCoreArchetype(coreArchetype) ?? lookupTalentDescription(coreArchetype),
              )}
              {coreArchetype && archetypes.length > 0 && (
                <Text color="whiteAlpha.400" fontSize="xs">·</Text>
              )}
              {archetypes.map((a, i) => (
                <React.Fragment key={a}>
                  {i > 0 && <Text color="whiteAlpha.300" fontSize="xs">·</Text>}
                  {renderTooltipChip(a, describeArchetype(a), {italic: false, dim: true})}
                </React.Fragment>
              ))}
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
          {statusEffects.length > 0 && (
            <HStack spacing={1} wrap="wrap" mt={1}>
              {statusEffects.map((ae, i) => (
                <Tooltip
                  key={`${ae.id}-${i}`}
                  hasArrow
                  placement="top"
                  openDelay={200}
                  bg="#1f2125"
                  color="gray.100"
                  borderColor="whiteAlpha.200"
                  borderWidth="1px"
                  borderRadius="md"
                  label={
                    <Box fontSize="xs" maxW="320px">
                      <Text fontWeight="bold" mb={1}>{ae.effect.name}</Text>
                      {ae.effect.description && <Text>{ae.effect.description}</Text>}
                      {typeof ae.remainingDuration === "number" && (
                        <Text color="whiteAlpha.600" mt={1}>
                          {ae.remainingDuration} round{ae.remainingDuration === 1 ? "" : "s"} remaining
                        </Text>
                      )}
                    </Box>
                  }
                >
                  <Box
                    px={2}
                    py="2px"
                    bg="#5a2f8a"
                    color="white"
                    fontSize="10px"
                    fontWeight="bold"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    borderRadius="sm"
                    cursor="help"
                  >
                    {ae.effect.name}
                    {typeof ae.remainingDuration === "number" ? ` ${ae.remainingDuration}` : ""}
                  </Box>
                </Tooltip>
              ))}
            </HStack>
          )}
        </VStack>
      </HStack>

      <StatusCardOld participant={participant}/>

      <CharacteristicsOld
        characteristics={characteristics}
        setCurrentCharacteristic={setCurrentCharacteristic}
        onEdit={(key, value) => setStat(participant.id, key, value)}
      />

      <SkillListOld
        participant={participant}
        profileSkills={skills}
        characteristics={characteristics}
        currentCharacteristic={currentCharacteristic}
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

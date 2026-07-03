import React, { useState } from 'react';
import { Badge, Box, Button, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import useSessionPrepStore from '@/state/sessionPrepStore';
import useUserContentStore from '@/state/userContentStore';
import { ENCOUNTER_TEMPLATES, type EncounterTemplate, type NpcRef } from '@/data/encounterTemplates';
import { HALCYON_SCENES } from '@/data/halcyonHeist';
import { resolveEncounterVisual } from './encounterVisuals';
import PlayCastRow from './PlayCastRow';
import RollTableBlock from './RollTableBlock';
import DiceText from './DiceText';

/** Section caption used inside the scene card. */
const Cap: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <HStack spacing={2} mt={2.5} mb={1} align="baseline">
    <Text fontSize="9px" color="whiteAlpha.400" letterSpacing="0.14em" textTransform="uppercase" fontWeight="bold">
      {children}
    </Text>
    {hint && (
      <Text fontSize="9px" color="whiteAlpha.400" fontStyle="italic">
        {hint}
      </Text>
    )}
  </HStack>
);

/** Beat text → optional leading chip. Halcyon rooms encode hints as
 * "[ASK] …" / "[WATCH] …" and pressure rows as "Pressure N: …"; authored
 * beats are plain text. Parsed at render time so no data change is needed. */
function parseBeat(text: string): { chip?: string; chipColor?: string; body: string } {
  const verb = text.match(/^\[([A-Za-z ]{2,10})\]\s*(.*)$/s);
  if (verb) return { chip: verb[1].toUpperCase(), chipColor: '#c9a765', body: verb[2] };
  const pressure = text.match(/^Pressure\s*(\d*)\s*:\s*(.*)$/s);
  if (pressure) return { chip: `HEAT ${pressure[1]}`.trim(), chipColor: '#d39939', body: pressure[2] };
  return { body: text };
}

function toRefs(npcs?: (string | NpcRef)[]): NpcRef[] {
  return (npcs ?? []).map((n) => (typeof n === 'string' ? { name: n } : n));
}

/**
 * ActiveScenePlay — the live scene as the play surface's centrepiece. Unlike
 * the prep-binder card this expands everything by default: read-aloud styled
 * apart from GM text, beats as unordered tap-when-used "moments", the cast as
 * full identity+want rows, roll tables rollable in place, and the running
 * notes. Ending the scene is two-step — it throws away notes and used-state.
 */
const ActiveScenePlay: React.FC = () => {
  const activeScene = useSessionPrepStore((s) => s.activeScene);
  const clearActiveScene = useSessionPrepStore((s) => s.clearActiveScene);
  const setNotes = useSessionPrepStore((s) => s.setNotes);
  const toggleBeat = useSessionPrepStore((s) => s.toggleBeat);
  const updateSceneNpc = useSessionPrepStore((s) => s.updateSceneNpc);
  const userEncounters = useUserContentStore((s) => s.userEncounters);
  const startFromTemplate = useSessionPrepStore((s) => s.startFromTemplate);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [readOpen, setReadOpen] = useState(false);

  if (!activeScene) return null;

  // Source template lookup covers all three libraries — GM-authored scenes and
  // Halcyon rooms included (the old card only searched the bundled samples, so
  // user scenes lost their icon/accent).
  const source: EncounterTemplate | undefined =
    userEncounters.find((t) => t.id === activeScene.fromTemplateId) ??
    ENCOUNTER_TEMPLATES.find((t) => t.id === activeScene.fromTemplateId) ??
    HALCYON_SCENES.find((t) => t.id === activeScene.fromTemplateId);
  const visual = resolveEncounterVisual(source ?? {});
  const accent = source?.accentColor ?? visual.color;

  // First paragraph reads as the scene-setter (performed); the rest is GM
  // material — long tails (e.g. Halcyon room dossiers) fold behind "more".
  const paragraphs = activeScene.description.split(/\n\s*\n/).filter((p) => p.trim());
  const [lead, ...rest] = paragraphs;
  const restText = rest.join('\n\n');
  const longTail = restText.length > 420;

  const npcs = toRefs(activeScene.npcs);
  const beats = activeScene.beats ?? [];
  const used = activeScene.beatsUsed ?? [];
  const floor = activeScene.floor ?? [];
  const angles = activeScene.angles ?? [];
  const clampRead = lead.length > 280;

  // Walk-to chips: adjacent scene titles resolved against all three libraries.
  const linkTargets = (activeScene.links ?? []).map((title) => {
    const target =
      HALCYON_SCENES.find((t) => t.title === title) ??
      userEncounters.find((t) => t.title === title) ??
      ENCOUNTER_TEMPLATES.find((t) => t.title === title);
    return { title, target };
  });

  return (
    <Box
      bg="#1f2225"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderLeftWidth="3px"
      borderLeftColor={accent}
      borderRadius="md"
      overflow="hidden"
    >
      {/* Header */}
      <HStack px={2} py={1.5} spacing={2} bg="whiteAlpha.50">
        <Box color={accent} fontSize="14px" display="inline-flex" flexShrink={0}>
          {visual.icon}
        </Box>
        <Text color="white" fontSize="sm" fontWeight="semibold" flex="1" noOfLines={1}>
          {activeScene.title}
        </Text>
        <Badge bg="#3a7e57" color="white" fontSize="9px" textTransform="uppercase" px={1} borderRadius="sm">
          Live
        </Badge>
        <Button
          size="xs"
          h="18px"
          px={1.5}
          fontSize="2xs"
          variant="ghost"
          color={confirmEnd ? '#e08080' : 'whiteAlpha.500'}
          bg={confirmEnd ? 'rgba(176,48,48,0.18)' : undefined}
          _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
          onClick={() => (confirmEnd ? clearActiveScene() : setConfirmEnd(true))}
          onMouseLeave={() => setConfirmEnd(false)}
        >
          {confirmEnd ? 'End scene?' : 'End'}
        </Button>
      </HStack>

      <Box px={2} pb={2}>
        {/* Read-aloud lead — clamped when long (it's performed, not studied),
            + folded GM tail */}
        {lead && (
          <Box mt={2}>
            <Text
              color="whiteAlpha.800"
              fontSize="xs"
              fontStyle="italic"
              lineHeight="1.5"
              whiteSpace="pre-wrap"
              borderLeftWidth="2px"
              borderColor="whiteAlpha.300"
              pl={2}
              noOfLines={clampRead && !readOpen ? 4 : undefined}
            >
              {lead}
            </Text>
            {clampRead && (
              <Box
                as="button"
                color="whiteAlpha.400"
                fontSize="2xs"
                mt={0.5}
                pl={2}
                _hover={{ color: 'whiteAlpha.700' }}
                onClick={() => setReadOpen((v) => !v)}
              >
                {readOpen ? '▴ less' : '▾ read on'}
              </Box>
            )}
          </Box>
        )}
        {restText && (
          <>
            <Text
              color="whiteAlpha.600"
              fontSize="xs"
              lineHeight="1.5"
              whiteSpace="pre-wrap"
              mt={1.5}
              noOfLines={longTail && !showFullText ? 6 : undefined}
            >
              {restText}
            </Text>
            {longTail && (
              <Box
                as="button"
                color="whiteAlpha.400"
                fontSize="2xs"
                mt={0.5}
                _hover={{ color: 'whiteAlpha.700' }}
                onClick={() => setShowFullText((v) => !v)}
              >
                {showFullText ? '▴ less' : '▾ more'}
              </Box>
            )}
          </>
        )}

        {/* The floor — ambient vignettes; amber dot = watching back */}
        {floor.length > 0 && (
          <>
            <Cap>The floor</Cap>
            <VStack align="stretch" spacing="2px">
              {floor.map((v, i) => (
                <HStack key={i} align="flex-start" spacing={2} px={0.5}>
                  <Text fontSize="8px" mt="4px" color={v.watch ? '#d39939' : 'whiteAlpha.400'} flexShrink={0}>
                    ●
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="2xs" fontStyle="italic" lineHeight="1.45">
                    {v.text}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </>
        )}

        {/* Moments — unordered, tap when used */}
        {beats.length > 0 && (
          <>
            <Cap hint="any order · tap when used">Moments</Cap>
            <VStack align="stretch" spacing="2px">
              {beats.map((b, i) => {
                const { chip, chipColor, body } = parseBeat(b);
                const isUsed = !!used[i];
                return (
                  <HStack
                    key={i}
                    align="flex-start"
                    spacing={2}
                    px={1.5}
                    py={1}
                    borderRadius="md"
                    cursor="pointer"
                    opacity={isUsed ? 0.42 : 1}
                    _hover={{ bg: 'whiteAlpha.50' }}
                    onClick={() => toggleBeat(i)}
                  >
                    <Box
                      w="13px"
                      h="13px"
                      mt="2px"
                      flexShrink={0}
                      borderRadius="sm"
                      borderWidth="1.5px"
                      borderColor={isUsed ? '#3a7e57' : 'whiteAlpha.400'}
                      bg={isUsed ? 'rgba(58,126,87,0.28)' : undefined}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {isUsed && <Text fontSize="8px" color="#9fd4b4" lineHeight="1">✓</Text>}
                    </Box>
                    <Text color="whiteAlpha.800" fontSize="2xs" lineHeight="1.45" flex="1">
                      {chip && (
                        <Box
                          as="span"
                          color={chipColor}
                          borderWidth="1px"
                          borderColor={chipColor}
                          borderRadius="sm"
                          fontSize="8px"
                          fontWeight="bold"
                          letterSpacing="0.08em"
                          px={1}
                          mr={1.5}
                          whiteSpace="nowrap"
                        >
                          {chip}
                        </Box>
                      )}
                      {body}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          </>
        )}

        {/* Cast */}
        {npcs.length > 0 && (
          <>
            <Cap>Cast</Cap>
            <VStack align="stretch" spacing="3px">
              {npcs.map((n, i) => (
                <PlayCastRow key={i} npc={n} onPatch={(p) => updateSceneNpc(i, p)} />
              ))}
            </VStack>
          </>
        )}

        {/* Angles — PC-specific approach options, dice glyphs coloured */}
        {angles.length > 0 && (
          <>
            <Cap>{activeScene.anglesLabel ?? 'Angles'}</Cap>
            <VStack align="stretch" spacing="2px">
              {angles.map((a, i) => (
                <HStack key={i} align="flex-start" spacing={2} px={0.5}>
                  <Text fontSize="9px" mt="2px" color="#7fb0ca" flexShrink={0}>▸</Text>
                  <Text color="whiteAlpha.700" fontSize="2xs" lineHeight="1.45">
                    <DiceText text={a} />
                  </Text>
                </HStack>
              ))}
            </VStack>
          </>
        )}

        {/* Roll tables */}
        {activeScene.tables && activeScene.tables.length > 0 && (
          <>
            <Cap>Roll tables</Cap>
            <VStack align="stretch" spacing={1.5}>
              {activeScene.tables.map((t) => (
                <RollTableBlock key={t.id} table={t} editable={false} />
              ))}
            </VStack>
          </>
        )}

        {/* Nudge — for when it stalls */}
        {activeScene.nudge && (
          <Box
            mt={2.5}
            px={2}
            py={1}
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="rgba(201,167,101,0.35)"
            bg="rgba(201,167,101,0.08)"
            borderRadius="md"
          >
            <Text fontSize="8px" fontWeight="bold" letterSpacing="0.12em" textTransform="uppercase" color="rgba(203,185,138,0.6)">
              If it stalls
            </Text>
            <Text fontSize="2xs" color="#cbb98a" lineHeight="1.45">
              {activeScene.nudge}
            </Text>
          </Box>
        )}

        {/* Exits — physical routes + walk-to chips for adjacent scenes */}
        {(activeScene.exits || linkTargets.length > 0) && (
          <>
            <Cap>Exits</Cap>
            {activeScene.exits && (
              <Text color="whiteAlpha.500" fontSize="2xs" lineHeight="1.4" px={0.5} mb={linkTargets.length ? 1 : 0}>
                {activeScene.exits}
              </Text>
            )}
            {linkTargets.length > 0 && (
              <HStack spacing={1} flexWrap="wrap" rowGap="4px">
                {linkTargets.map(({ title, target }) => {
                  const dot = target ? target.accentColor ?? resolveEncounterVisual(target).color : undefined;
                  return (
                    <HStack
                      key={title}
                      as="button"
                      spacing={1.5}
                      px={2}
                      py="2px"
                      borderWidth="1px"
                      borderColor="whiteAlpha.300"
                      borderRadius="full"
                      bg="#26292d"
                      cursor={target ? 'pointer' : 'default'}
                      opacity={target ? 1 : 0.5}
                      _hover={target ? { borderColor: 'whiteAlpha.500', color: 'white' } : undefined}
                      onClick={target ? () => startFromTemplate(target) : undefined}
                      title={target ? `Walk to ${title}` : title}
                    >
                      {dot && <Box w="6px" h="6px" borderRadius="full" bg={dot} flexShrink={0} />}
                      <Text color="whiteAlpha.700" fontSize="10px" fontWeight="semibold" lineHeight="1.4">
                        {title}
                      </Text>
                    </HStack>
                  );
                })}
              </HStack>
            )}
          </>
        )}

        {/* Running notes */}
        <Textarea
          value={activeScene.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Running notes…"
          size="sm"
          mt={2.5}
          minH="36px"
          py={1}
          px={2}
          bg="#26292d"
          borderColor="whiteAlpha.200"
          color="whiteAlpha.900"
          fontSize="xs"
          lineHeight="1.35"
          _placeholder={{ color: 'whiteAlpha.400' }}
          _focus={{ borderColor: 'whiteAlpha.400', boxShadow: 'none' }}
          resize="vertical"
        />
      </Box>
    </Box>
  );
};

export default ActiveScenePlay;

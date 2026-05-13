import React, { useMemo, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import useSessionLogStore, {
  LogEntry,
  Reminder,
} from "@/state/sessionLogStore";
import { renderSwrpgText } from "@/utils/swrpgText";

const toneBorder: Record<NonNullable<LogEntry["tone"]>, string> = {
  info: "whiteAlpha.300",
  warn: "#d39939",
  good: "#3a7e57",
  bad:  "#b03030",
};

function formatTime(at: number): string {
  const d = new Date(at);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Section building ───────────────────────────────────────────────────────
// Walk the timeline forward, opening an "encounter" or "skillChallenge"
// section on the matching start kind and closing it on the matching end.
// Anything outside an open section goes into a transient "interim" section.
// Skill challenges and encounters are mutually exclusive in the toolbar so we
// don't expect overlap; a defensive new-start-while-other-open closes the
// previous and starts fresh.
type EncounterSectionT = {
  kind: "encounter";
  id: string;
  encounterNumber: number;
  entries: LogEntry[];
  ended: boolean;
};
type SkillChallengeSectionT = {
  kind: "skillChallenge";
  id: string;
  name: string;
  /** 'won' | 'lost' | 'abandoned' once ended; undefined while active. */
  outcome?: string;
  entries: LogEntry[];
  ended: boolean;
};
type InterimSectionT = {
  kind: "interim";
  id: string;
  entries: LogEntry[];
};
type Section = EncounterSectionT | SkillChallengeSectionT | InterimSectionT;

function buildSections(timeline: LogEntry[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  let counter = 0;

  for (const entry of timeline) {
    if (entry.kind === "encounter-start") {
      if (current) sections.push(current);
      counter++;
      current = {
        kind: "encounter",
        id: entry.id,
        encounterNumber:
          (entry.meta?.encounterNumber as number | undefined) ?? counter,
        entries: [entry],
        ended: false,
      };
    } else if (entry.kind === "encounter-end") {
      if (current && current.kind === "encounter") {
        current.entries.push(entry);
        current.ended = true;
        sections.push(current);
        current = null;
      }
      // A stray encounter-end with no open section shouldn't happen but
      // would be safely ignored — drop it.
    } else if (entry.kind === "skill-challenge-start") {
      if (current) sections.push(current);
      current = {
        kind: "skillChallenge",
        id: entry.id,
        name: (entry.meta?.name as string | undefined) ?? "Skill Challenge",
        entries: [entry],
        ended: false,
      };
    } else if (entry.kind === "skill-challenge-end") {
      if (current && current.kind === "skillChallenge") {
        current.entries.push(entry);
        current.ended = true;
        current.outcome = entry.meta?.outcome as string | undefined;
        sections.push(current);
        current = null;
      }
    } else {
      if (!current) {
        current = { kind: "interim", id: entry.id, entries: [entry] };
      } else {
        current.entries.push(entry);
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ── Subcomponents ──────────────────────────────────────────────────────────

const ReminderCard: React.FC<{ reminder: Reminder }> = ({ reminder }) => {
  const resolveReminder = useSessionLogStore((s) => s.resolveReminder);

  const handleApply = () => {
    reminder.onApply?.();
    resolveReminder(reminder.id, "applied");
  };
  const handleSkip = () => {
    reminder.onSkip?.();
    resolveReminder(reminder.id, "skipped");
  };

  return (
    <Box
      bg="#1d2025"
      borderLeftWidth="3px"
      borderColor="#d39939"
      borderRadius="sm"
      p={2}
    >
      <Text fontSize="xs" color="white" fontWeight="bold">
        {reminder.effectName}
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700" mt={0.5}>
        {reminder.participantName}
        {reminder.description ? ` — ${reminder.description}` : ""}
      </Text>
      <HStack spacing={2} mt={2}>
        {reminder.hasApplyAction && (
          <Button
            size="xs"
            bg="#d39939"
            color="#1a1d24"
            fontWeight="bold"
            _hover={{ bg: "yellow.400" }}
            onClick={handleApply}
          >
            Apply now
          </Button>
        )}
        <Button
          size="xs"
          variant="ghost"
          color="whiteAlpha.700"
          _hover={{ bg: "whiteAlpha.100" }}
          onClick={handleSkip}
        >
          {reminder.hasApplyAction ? "Skip" : "Acknowledge"}
        </Button>
      </HStack>
    </Box>
  );
};

const TimelineRow: React.FC<{ entry: LogEntry }> = ({ entry }) => {
  const border = toneBorder[entry.tone ?? "info"];
  return (
    <HStack
      spacing={2}
      px={2}
      py={1}
      borderLeftWidth="2px"
      borderColor={border}
      fontSize="xs"
      color="whiteAlpha.800"
      align="start"
    >
      <Text color="whiteAlpha.400" minW="62px" fontFamily="mono" fontSize="10px" pt="1px">
        {formatTime(entry.at)}
      </Text>
      <Box
        noOfLines={3}
        sx={{
          // Inherit whatever the surrounding row's text color is so icons
          // read against the dark Sidebar bg without their default near-black
          // glyph fill (which disappears on the dark theme). Specific dice
          // kinds (boost, setback, etc.) override below so the GM still sees
          // boost as blue, setback as a contrasting grey, etc.
          //
          // The base .icon style adds `top: 2px` (a nudge that suits the
          // larger contexts where the icon font is normally used). Inline
          // with body text it pushes the glyph below the baseline — override
          // back to 0 and align via inline-flex so the glyph centers on the
          // line height instead of the font's text baseline.
          '& .icon': {
            color: 'currentColor',
            fontSize: '13px',
            top: 0,
            display: 'inline-flex',
            alignItems: 'center',
            verticalAlign: '-0.18em',
            lineHeight: 1,
            marginX: '1px',
          },
          '& .icon::before, & .icon::after': {
            color: 'currentColor',
          },
          // Per-kind color overrides — selectors with two classes win over
          // the single-class `.icon` rule above. Setback's native #413C42
          // disappears on the dark Sidebar bg, so we bump it to a visible
          // grey while keeping the "dark/black die" reading.
          '& .icon.boost': { color: '#A0D9F5' },
          '& .icon.setback': { color: '#BFBFBF' },
          '& .icon.ability': { color: '#52B849' },
          '& .icon.proficiency': { color: '#FEE800' },
          '& .icon.difficulty': { color: '#9B6FCE' },
          '& .icon.challenge': { color: '#E21D37' },
          '& .icon.force': { color: '#FFFFFF' },
        }}
      >
        {renderSwrpgText(entry.summary)}
      </Box>
    </HStack>
  );
};

const EncounterSection: React.FC<{
  section: EncounterSectionT;
  isActive: boolean;
}> = ({ section, isActive }) => {
  // Active encounters expanded by default; past encounters collapsed.
  const [expanded, setExpanded] = useState(isActive);
  const entriesNewestFirst = useMemo(
    () => [...section.entries].reverse(),
    [section.entries],
  );

  return (
    <Box
      borderWidth="1px"
      borderColor={isActive ? "#3a7e57" : "whiteAlpha.150"}
      borderRadius="md"
      overflow="hidden"
      bg="rgba(255,255,255,0.02)"
    >
      <HStack
        as="button"
        type="button"
        onClick={() => setExpanded(!expanded)}
        w="100%"
        px={2}
        py={1.5}
        bg={isActive ? "rgba(58,126,87,0.1)" : "rgba(255,255,255,0.03)"}
        _hover={{ bg: "whiteAlpha.100" }}
        justify="space-between"
      >
        <HStack spacing={2}>
          {expanded ? (
            <ChevronDownIcon boxSize={3} color="whiteAlpha.700" />
          ) : (
            <ChevronRightIcon boxSize={3} color="whiteAlpha.700" />
          )}
          <Text fontSize="xs" fontWeight="bold" color="white">
            Encounter {section.encounterNumber}
          </Text>
          <Text
            fontSize="9px"
            color={isActive ? "#3a7e57" : "whiteAlpha.500"}
            letterSpacing="0.1em"
            textTransform="uppercase"
          >
            {isActive ? "Active" : "Ended"}
          </Text>
        </HStack>
        <Text fontSize="9px" color="whiteAlpha.400">
          {section.entries.length}
          {section.entries.length === 1 ? " event" : " events"}
        </Text>
      </HStack>
      {expanded && (
        <VStack align="stretch" spacing={0.5} p={1}>
          {entriesNewestFirst.map((e) => (
            <TimelineRow key={e.id} entry={e} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

const SkillChallengeSection: React.FC<{
  section: SkillChallengeSectionT;
  isActive: boolean;
}> = ({ section, isActive }) => {
  const [expanded, setExpanded] = useState(isActive);
  const entriesNewestFirst = useMemo(
    () => [...section.entries].reverse(),
    [section.entries],
  );

  // Status colour: active = orange (skill challenge accent), won = green,
  // lost = red, abandoned = dim.
  const outcome = section.outcome;
  const accent = isActive
    ? "#d39939"
    : outcome === "won"
      ? "#3a7e57"
      : outcome === "lost"
        ? "#b03030"
        : "whiteAlpha.150";
  const statusLabel = isActive ? "Active" : outcome ?? "Ended";

  return (
    <Box
      borderWidth="1px"
      borderColor={accent}
      borderRadius="md"
      overflow="hidden"
      bg="rgba(255,255,255,0.02)"
    >
      <HStack
        as="button"
        type="button"
        onClick={() => setExpanded(!expanded)}
        w="100%"
        px={2}
        py={1.5}
        bg={isActive ? "rgba(211,153,57,0.10)" : "rgba(255,255,255,0.03)"}
        _hover={{ bg: "whiteAlpha.100" }}
        justify="space-between"
      >
        <HStack spacing={2} minW={0}>
          {expanded ? (
            <ChevronDownIcon boxSize={3} color="whiteAlpha.700" />
          ) : (
            <ChevronRightIcon boxSize={3} color="whiteAlpha.700" />
          )}
          <Text
            fontSize="9px"
            color={accent}
            letterSpacing="0.1em"
            textTransform="uppercase"
            fontWeight="bold"
            flexShrink={0}
          >
            Skill Challenge
          </Text>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="white"
            noOfLines={1}
            minW={0}
          >
            {section.name}
          </Text>
          <Text
            fontSize="9px"
            color={accent}
            letterSpacing="0.1em"
            textTransform="uppercase"
            flexShrink={0}
          >
            {statusLabel}
          </Text>
        </HStack>
        <Text fontSize="9px" color="whiteAlpha.400" flexShrink={0}>
          {section.entries.length}
          {section.entries.length === 1 ? " event" : " events"}
        </Text>
      </HStack>
      {expanded && (
        <VStack align="stretch" spacing={0.5} p={1}>
          {entriesNewestFirst.map((e) => (
            <TimelineRow key={e.id} entry={e} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

const InterimSection: React.FC<{ section: InterimSectionT }> = ({ section }) => {
  const entriesNewestFirst = useMemo(
    () => [...section.entries].reverse(),
    [section.entries],
  );
  return (
    <VStack align="stretch" spacing={0.5} px={1}>
      {entriesNewestFirst.map((e) => (
        <TimelineRow key={e.id} entry={e} />
      ))}
    </VStack>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const reminders = useSessionLogStore((s) => s.reminders);
  const timeline = useSessionLogStore((s) => s.timeline);

  const sections = useMemo(() => buildSections(timeline), [timeline]);
  const sectionsNewestFirst = useMemo(() => [...sections].reverse(), [sections]);

  // The active section (encounter or skill challenge) is the most recent
  // open one — used for accent colour + auto-expand. Skill challenges and
  // encounters are mutually exclusive in the toolbar so at most one of
  // either kind should be open at a time.
  const activeSectionId = useMemo(() => {
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if ((s.kind === "encounter" || s.kind === "skillChallenge") && !s.ended) {
        return s.id;
      }
    }
    return undefined;
  }, [sections]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      h="100%"
      overflow="hidden"
      bg="#2A2C30"
      borderRadius="md"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      {/* Header */}
      <Box px={3} py={2} borderBottomWidth="1px" borderColor="whiteAlpha.150">
        <Text
          fontSize="xs"
          color="whiteAlpha.500"
          letterSpacing="0.16em"
          textTransform="uppercase"
          fontWeight="bold"
        >
          Session Log
        </Text>
      </Box>

      {/* Pinned reminders */}
      {reminders.length > 0 && (
        <Box
          px={2}
          py={2}
          borderBottomWidth="1px"
          borderColor="whiteAlpha.150"
          bg="rgba(211,153,57,0.05)"
          maxH="40%"
          overflowY="auto"
        >
          <Text
            fontSize="9px"
            color="whiteAlpha.500"
            letterSpacing="0.16em"
            textTransform="uppercase"
            mb={2}
            px={1}
          >
            Reminders ({reminders.length})
          </Text>
          <VStack align="stretch" spacing={2}>
            {reminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </VStack>
        </Box>
      )}

      {/* Sections — newest at top */}
      <Box flex="1" overflowY="auto" px={2} py={2} minH={0}>
        {sectionsNewestFirst.length === 0 ? (
          <Text fontSize="xs" color="whiteAlpha.400" px={1} py={2}>
            No events yet. Add participants and start an encounter to see the log.
          </Text>
        ) : (
          <VStack align="stretch" spacing={2}>
            {sectionsNewestFirst.map((section) => {
              if (section.kind === "encounter") {
                return (
                  <EncounterSection
                    key={section.id}
                    section={section}
                    isActive={section.id === activeSectionId}
                  />
                );
              }
              if (section.kind === "skillChallenge") {
                return (
                  <SkillChallengeSection
                    key={section.id}
                    section={section}
                    isActive={section.id === activeSectionId}
                  />
                );
              }
              return <InterimSection key={section.id} section={section} />;
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;

import React, { useMemo, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import useSessionLogStore, {
  LogEntry,
  Reminder,
} from "@/state/sessionLogStore";

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
// Walk the timeline forward, opening an "encounter" section at every
// encounter-start and closing it at the matching encounter-end. Anything
// outside an open encounter goes into a transient "interim" section.
type EncounterSectionT = {
  kind: "encounter";
  id: string;
  encounterNumber: number;
  entries: LogEntry[];
  ended: boolean;
};
type InterimSectionT = {
  kind: "interim";
  id: string;
  entries: LogEntry[];
};
type Section = EncounterSectionT | InterimSectionT;

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
      <Text noOfLines={3}>{entry.summary}</Text>
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

  // The active encounter is the most recent encounter section without an
  // encounter-end entry. Identifying it lets us auto-expand its card.
  const activeEncounterId = useMemo(() => {
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (s.kind === "encounter" && !s.ended) return s.id;
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
            {sectionsNewestFirst.map((section) =>
              section.kind === "encounter" ? (
                <EncounterSection
                  key={section.id}
                  section={section}
                  isActive={section.id === activeEncounterId}
                />
              ) : (
                <InterimSection key={section.id} section={section} />
              ),
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;

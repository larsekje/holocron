import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Box,
    Text,
    VStack,
    Button,
    HStack,
    NumberInputField,
    NumberInput,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Switch, useToast,
  Tag,
  Select,
} from "@chakra-ui/react";
import {CritEntry, CritInjury, CritSeverity, critTable, vehicleCritTable} from "@/data/critTable";
import {CheckCircleIcon, AddIcon, MinusIcon, TriangleUpIcon, TriangleDownIcon} from "@chakra-ui/icons";
import useParticipantStore from "@/state/participantsStore";
import {useEffectStore} from "@/state/effectStore";
import {Effect, EffectTarget, StatusFactories} from "@/types/effectTypes";
import {useEffectReminder} from "@/hooks/useEffectReminder";
import useSessionLogStore from "@/state/sessionLogStore";
import {nanoid} from "nanoid";
import useGameplayStore from "@/state/newGameplayStore";

/**
 * Map a personal-scale crit table entry to a real Effect (or null for purely
 * narrative entries — e.g. "Sudden Jolt: drops what's held").
 *
 * Adding a new mapping is a one-liner once the matching StatusFactories entry
 * exists. `target` is passed through so the produced effect targets the right
 * participant.
 */
function buildCritEffect(entry: CritEntry, target: EffectTarget): Effect | null {
  const id = nanoid();
  const t = entry.title.toLowerCase();

  // Easy
  if (t === 'minor nick')         return null;                                  // 1 strain — apply manually
  if (t === 'slowed down')        return StatusFactories.slowed(id, target);
  if (t === 'sudden jolt')        return null;                                  // Drops what's held — narrative
  if (t === 'distracted')         return StatusFactories.distracted(id, target);
  if (t === 'off-balance')        return StatusFactories.offBalance(id, target);
  if (t === 'discouraging wound') return null;                                  // Destiny flip — narrative
  if (t === 'stunned')            return StatusFactories.staggered(id, target, 1);

  // Average
  if (t === 'head ringer')        return StatusFactories.headRinger(id, target);
  if (t === 'at the brink')       return StatusFactories.atTheBrink(id, target);
  if (t === 'hamstrung')          return StatusFactories.hamstrung(id, target);
  if (t === 'overpowered')        return null;                                  // Free follow-up attack — narrative

  // Hard
  if (t === 'compromised')        return StatusFactories.compromised(id, target);
  if (t === 'maimed')             return StatusFactories.maimed(id, target);
  if (t === 'horrific injury')    return StatusFactories.horrificInjury(id, target);

  // Daunting
  if (t === 'temporarily lame')   return StatusFactories.temporarilyLame(id, target);
  if (t === 'crippled')           return StatusFactories.crippled(id, target);
  if (t === 'the end is nigh')    return StatusFactories.endIsNigh(id, target);

  // Formidable
  if (t === 'mortally wounded')   return StatusFactories.mortallyWounded(id, target);
  if (t === 'bleeding out')       return StatusFactories.bleedingOut(id, target);
  if (t === 'deadly blow')        return null;                                  // Incapacitation — narrative

  return null;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // When provided, the modal applies the rolled crit to this participant directly and the
  // internal target selector is hidden. Otherwise it falls back to picking a participant.
  participantId?: string;
};

const severityColor: Record<CritSeverity, string> = {
  Easy: "purple.300",
  Average: "purple.300",
  Hard: "purple.300",
  Daunting: "purple.300",
  Formidable: "purple.300",
};

const diffPips: Record<CritSeverity, number> = {
  Easy: 1,
  Average: 2,
  Hard: 3,
  Daunting: 4,
  Formidable: 5,
};

// Tiny purple diamond to mimic a difficulty die pip
const CritDieIcon: React.FC = () => (
  <Box
    width="10px"
    height="10px"
    bg="purple.300"
    transform="rotate(45deg)"
    borderRadius="2px"
    boxShadow="inset 0 0 0 1px rgba(255,255,255,0.35)"
    mr="4px"
  />
);

// Compact +/- control used in the modifiers row
const TinyStepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}> = ({ value, onChange, min = 0, step = 1 }) => (
  <HStack spacing={1}>
    <Button
      size="xs"
      variant="ghost"
      onClick={() => onChange(Math.max(min, value - step))}
      p={0}
      minW="18px"
      h="18px"
      borderWidth="1px"
      borderRadius="full"
      borderColor="whiteAlpha.400"
      color="whiteAlpha.700"
      _hover={{ bg: "transparent", borderColor: "whiteAlpha.700", color: "whiteAlpha.900" }}
    >
      <MinusIcon boxSize={2.5} />
    </Button>
    <Text fontWeight="bold" minW="14px" textAlign="center">
      {value}
    </Text>
    <Button
      size="xs"
      variant="ghost"
      onClick={() => onChange(value + step)}
      p={0}
      minW="18px"
      h="18px"
      borderWidth="1px"
      borderRadius="full"
      borderColor="whiteAlpha.400"
      color="whiteAlpha.700"
      _hover={{ bg: "transparent", borderColor: "whiteAlpha.700", color: "whiteAlpha.900" }}
    >
      <AddIcon boxSize={2.5} />
    </Button>
  </HStack>
);

// Character selector and summary row
const CharacterRow: React.FC<{
  isVehicle: boolean;
  selectedId: string;
  setSelectedId: (id: string) => void;
  onChangePrevCrits: (count: number) => void;
}> = ({ isVehicle, selectedId, setSelectedId, onChangePrevCrits }) => {
  const { participants } = useParticipantStore();
  const selected = participants.find(p => p.id === selectedId);
  const injuries = selected?.criticalInjuries || [];

  // Sync prev crits modifier to injuries count
  useEffect(() => {
    onChangePrevCrits(injuries.length);
  }, [selectedId, injuries.length]);

  return (
    <Box
      p={2}
      borderWidth="1px"
      borderColor="gray.700"
      borderRadius="md"
      bg="gray.800"
    >
      <HStack justify="space-between" align="center" flexWrap="wrap">
        <HStack>
          <Text fontSize="sm" color="whiteAlpha.800">Target</Text>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              background: '#2d3748',
              color: 'white',
              border: '1px solid #4a5568',
              borderRadius: 6,
              padding: '4px 8px',
            }}
          >
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </HStack>
        <HStack>
          <Text fontSize="xs" color="whiteAlpha.600">Crits:</Text>
          <Text fontSize="sm" fontWeight="bold">{injuries.length}</Text>
        </HStack>
      </HStack>
      {injuries.length > 0 && (
        <Box mt={2}>
          {injuries.slice(-4).map((ci) => (
            <Text key={ci.id} fontSize="xs" color="whiteAlpha.700">
              • {ci.title} ({ci.severity})
            </Text>
          ))}
          {injuries.length > 4 && (
            <Text fontSize="xs" color="whiteAlpha.500">… and {injuries.length - 4} more</Text>
          )}
        </Box>
      )}
    </Box>
  );
};

// Preview label for the "Will apply" line, derived from buildCritEffect so the
// preview never drifts from what the Apply button actually does.
function previewCritEffect(entry?: CritEntry): { label: string; willApply: boolean } {
  if (!entry) return { label: 'None', willApply: false };
  const eff = buildCritEffect(entry, { type: 'character', participantId: 'preview' });
  if (!eff) return { label: 'None (narrative only)', willApply: false };
  const dur =
    eff.duration === 'encounter'
      ? ' (until end of encounter)'
      : typeof eff.duration === 'number'
        ? ` (${eff.duration} round${eff.duration === 1 ? '' : 's'})`
        : ' (until healed)';
  return { label: `${eff.name}${dur}`, willApply: true };
}

// Compact vertical arrow stepper (tiny; matches the style used in effects UI)
const MiniStepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}> = ({ value, onChange, min = 0, step = 1 }) => (
  <HStack spacing={1} onClick={(e) => e.stopPropagation()} align="center">
    <Text fontWeight="semibold" minW="12px" textAlign="center" lineHeight="1" color="whiteAlpha.900">
      {value}
    </Text>
    <Box
      display="inline-flex"
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
      h="1.15em"
      w="14px"
      borderWidth="1px"
      borderColor="whiteAlpha.400"
      borderRadius="sm"
      overflow="hidden"
    >
      <Box
        as="button"
        aria-label="increase"
        onClick={() => onChange(value + step)}
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="50%"
        w="100%"
        _hover={{ bg: "transparent" }}
      >
        <TriangleUpIcon boxSize="0.5em" color="whiteAlpha.700" />
      </Box>
      <Box
        as="button"
        aria-label="decrease"
        onClick={() => onChange(Math.max(min, value - step))}
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="50%"
        w="100%"
        _hover={{ bg: "transparent" }}
      >
        <TriangleDownIcon boxSize="0.5em" color="whiteAlpha.700" />
      </Box>
    </Box>
  </HStack>
);

const CritRollerModal: React.FC<Props> = ({ isOpen, onClose, participantId }) => {
  // Dark palette aligned with the SWRPG popover/dialog look (#16181c shell, amber accents).
  const modalBg = "#16181c";
  const headerDivider = "#0a0b0d";
  const rowBg = "#1d2025";
  const altRowBg = "#16181c";
  const textMain = "whiteAlpha.900";
  const textDim = "whiteAlpha.700";
  const accentColor = "#d39939";

  // Personal vs. Vehicle table toggle
  const [isVehicle, setIsVehicle] = useState(false);
  const table = isVehicle ? vehicleCritTable : critTable;

  // Shared participant selection. When the caller passes a participantId, that participant
  // is the target and the in-modal selector is hidden. Otherwise we fall back to the active
  // participant or the first in the store.
  const { participants, addCriticalInjury } = useParticipantStore();
  const toast = useToast();
  const { addEffect } = useEffectStore();
  const wrapEffect = useEffectReminder();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    participantId ?? participants[0]?.id ?? "",
  );

  useEffect(() => {
    if (participantId) setSelectedParticipantId(participantId);
  }, [participantId]);

  useEffect(() => {
    if (participantId) return;
    if (!selectedParticipantId && participants[0]) setSelectedParticipantId(participants[0].id);
  }, [participants.length, participantId]);

  // Default to Active participant on modal open (only when no explicit prop).
  const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);
  useEffect(() => {
    if (!isOpen || participantId) return;
    if (activeParticipantId && participants.some(p => p.id === activeParticipantId)) {
      setSelectedParticipantId(activeParticipantId);
    }
  }, [isOpen, activeParticipantId, participants, participantId]);

  // Titles of critical injuries the selected participant already has (Personal mode only)
  const ownedTitles = useMemo(() => {
    if (isVehicle) return new Set<string>();
    const sel = participants.find(p => p.id === selectedParticipantId);
    return new Set((sel?.criticalInjuries || []).map(ci => ci.title.toLowerCase()));
  }, [participants, selectedParticipantId, isVehicle]);

  // Rolling state
  const [roll, setRoll] = useState<number | null>(null);
  const [prevCrits, setPrevCrits] = useState<number>(0);  // +10 each
  const [vicious, setVicious] = useState<number>(0);      // +10 each
  const [lethal, setLethal] = useState<number>(0);        // +10 each
  const [miscMod, setMiscMod] = useState<number>(0);      // free modifier

  // Keep Prev Crits in sync with the selected character’s existing injuries
  useEffect(() => {
    const sel = participants.find(p => p.id === selectedParticipantId);
    const count = sel?.criticalInjuries?.length ?? 0;
    setPrevCrits(count);
  }, [selectedParticipantId, participants]);

  const base = roll ?? 0;
  const totalUncapped = base + 10 * (prevCrits + vicious + lethal) + miscMod;
  const total = Math.max(1, Math.min(100, totalUncapped)); // clamp to table for now

  const findIndexFor = (value: number) =>
    table.findIndex((e) => value >= e.min && value <= e.max);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const rowsRef = useRef<HTMLDivElement[]>([]);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  const scrollRowIntoView = (idx: number) => {
    const el = rowsRef.current[idx];
    const container = scrollBoxRef.current;
    if (el && container) {
      // Center the selected row within the inner scroll box without moving the whole modal
      const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (base > 0) {
      const idx = findIndexFor(total);
      if (idx >= 0) {
        setSelectedIndex(idx);
        scrollRowIntoView(idx);
      }
    }
  }, [base, total, isVehicle]);

  const doRoll = () => setRoll(Math.floor(Math.random() * 100) + 1);

  // Resolve the entry the Apply action acts on — the explicitly selected
  // row, else the row the current total falls into.
  const resolvedIndex =
    selectedIndex !== null && table[selectedIndex]
      ? selectedIndex
      : findIndexFor(total);
  const appliedEntry = resolvedIndex >= 0 ? table[resolvedIndex] : undefined;
  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);
  const canApply = !isVehicle && !!selectedParticipant && !!appliedEntry;

  const handleApply = () => {
    if (!canApply || !selectedParticipant || !appliedEntry) return;
    const injury: CritInjury = {
      id: nanoid(),
      title: appliedEntry.title,
      severity: appliedEntry.severity,
      summary: appliedEntry.summary,
      rollTotal: total,
      source: isVehicle ? "vehicle" : "personal",
      appliedAt: Date.now(),
    };
    addCriticalInjury(selectedParticipant.id, injury);
    useSessionLogStore.getState().log({
      kind: "crit-applied",
      participantId: selectedParticipant.id,
      participantName: selectedParticipant.name,
      summary: `Crit ${total}: ${appliedEntry.title} (${appliedEntry.severity}) → ${selectedParticipant.name}`,
      tone: "bad",
      meta: { title: appliedEntry.title, severity: appliedEntry.severity, rollTotal: total, isVehicle },
    });
    const effTarget: EffectTarget = { type: "character", participantId: selectedParticipant.id };
    const raw = buildCritEffect(appliedEntry, effTarget);
    if (raw) addEffect(wrapEffect(raw, selectedParticipant.name), effTarget);
    toast({
      title: "Critical Applied",
      description: `${appliedEntry.title} → ${selectedParticipant.name}`,
      status: "success",
      duration: 2500,
      isClosable: true,
    });
  };

  // Keyboard control while open: ↑/↓ walk the crit table, Enter applies the
  // highlighted row, R re-rolls. Skipped when a form control (the target
  // <select>) holds focus so it keeps native behaviour. The handler is
  // bound once per open and reads the latest handleApply through a ref.
  const liveRef = useRef({ handleApply });
  liveRef.current = { handleApply };
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setSelectedIndex((cur) => {
          const next =
            cur === null
              ? dir === 1
                ? 0
                : table.length - 1
              : Math.max(0, Math.min(table.length - 1, cur + dir));
          scrollRowIntoView(next);
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        liveRef.current.handleApply();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        doRoll();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, table]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="4xl">
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.6)"/>
      <ModalContent bg={modalBg} color={textMain} borderColor="#0a0b0d" borderWidth="1px" boxShadow="dark-lg" maxH="85vh" overflow="hidden">
        <Box h="3px" w="100%" bgGradient="linear(to-r, #7c3a2c, #d39939)"/>
        <ModalHeader bg="#0f1114" borderBottomWidth="1px" borderColor={headerDivider} py={2} px={3}>
          <HStack justify="space-between" align="center" width="100%">
            <HStack spacing={2} align="baseline">
              <Text
                as="b"
                fontSize="xs"
                letterSpacing="0.16em"
                textTransform="uppercase"
                color={accentColor}
              >
                Critical Injury
              </Text>
              {participantId && (
                <Text fontSize="sm" color={textMain} fontWeight="semibold">
                  {participants.find(p => p.id === participantId)?.name ?? "—"}
                </Text>
              )}
            </HStack>
            <HStack spacing={3} align="center">
              {/* Target (participant) selector - only when no explicit participantId prop */}
              {!isVehicle && !participantId && (
                <HStack spacing={2} align="center">
                  <Text fontSize="sm" color={textMain}>Target</Text>
                  <Select
                    value={selectedParticipantId}
                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                    size="sm"
                    w="200px"
                    bg="gray.700"
                    borderColor="gray.600"
                    color={textMain}
                    _hover={{ bg: "gray.700" }}
                    _focus={{ bg: "gray.700", borderColor: "gray.500" }}
                  >
                    {participants.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#2d3748', color: 'white' }}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}

              {/* Personal/Vehicle toggle */}
              <HStack spacing={2}>
                <Text fontSize="sm" color={isVehicle ? textDim : textMain} fontWeight={isVehicle ? "normal" : "bold"}>
                  Personal
                </Text>
                <Switch
                  isChecked={isVehicle}
                  onChange={(e) => setIsVehicle(e.target.checked)}
                  size="sm"
                  sx={{
                    "& .chakra-switch__track": {
                      bg: isVehicle ? "#7c3a2c" : "#d39939",
                    },
                  }}
                />
                <Text fontSize="sm" color={!isVehicle ? textDim : textMain} fontWeight={!isVehicle ? "normal" : "bold"}>
                  Vehicle
                </Text>
              </HStack>
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalBody pt={3} pr={3} pl={3} pb={0} display="flex" flexDirection="column" minH={0}>
          {/* Roll controls (fixed height) */}
          <Box
            p={3}
            borderWidth="1px"
            borderColor="#0a0b0d"
            borderRadius="md"
            bg="#0f1114"
          >
            <HStack spacing={3} flexWrap="wrap" align="center">


              <Button
                size="sm"
                bg="#d39939"
                color="#1a1d24"
                fontWeight="bold"
                letterSpacing="0.04em"
                _hover={{bg: "yellow.400"}}
                onClick={doRoll}
              >
                Roll d100
              </Button>
              <Text>
                Roll:{" "}
                <Text as="span" fontWeight="bold">
                  {base || "-"}
                </Text>
              </Text>
              <HStack spacing={2}>
                <Text color={textDim}>Prev Crits x10</Text>
                  <MiniStepper value={prevCrits} onChange={setPrevCrits} min={0} step={1} />
              </HStack>
              <HStack spacing={2}>
                <Text color={textDim}>Vicious x10</Text>
                  <MiniStepper value={vicious} onChange={setVicious} min={0} step={1} />
              </HStack>
              <HStack spacing={2}>
                <Text color={textDim}>Lethal x10</Text>
                  <MiniStepper value={lethal} onChange={setLethal} min={0} step={1} />
              </HStack>
              <HStack spacing={2}>
                <Text color={textDim}>Misc</Text>
                  <MiniStepper value={miscMod} onChange={setMiscMod} min={0} step={5} />
              </HStack>
              <Box flex="1" />
              <HStack>
                <Text color={textDim}>Total</Text>
                <Text fontWeight="bold">{total}</Text>
              </HStack>
            </HStack>
              <HStack mt={2} fontSize="sm" color={textDim} minH="28px" justify="space-between" align="center" flexWrap="wrap">
                <VStack align="start" spacing={0}>
                  {selectedIndex !== null && selectedIndex >= 0 && (
                    <>
                      <Text>
                        Result:{" "}
                        <Text as="span" fontWeight="bold" color={textMain}>
                          {table[selectedIndex].title}
                        </Text>
                      </Text>
                      {!isVehicle && (
                        <Text>
                          Will apply:{" "}
                          <Text as="span" fontWeight="bold" color={textMain}>
                            {previewCritEffect(table[selectedIndex]).label}
                          </Text>{" "}
                          to{" "}
                          <Text as="span" fontWeight="bold" color={textMain}>
                            {useParticipantStore.getState().participants.find(p => p.id === selectedParticipantId)?.name || "—"}
                          </Text>
                        </Text>
                      )}
                    </>
                  )}
                </VStack>
                {!isVehicle && (
                  <Button
                    size="sm"
                    bg="#d39939"
                    color="#1a1d24"
                    fontWeight="bold"
                    letterSpacing="0.04em"
                    _hover={{ bg: "yellow.400" }}
                    _disabled={{ bg: "whiteAlpha.200", color: "whiteAlpha.500", cursor: "not-allowed" }}
                    onClick={handleApply}
                    isDisabled={!canApply}
                  >
                    Apply
                  </Button>
                )}
            </HStack>
          </Box>

          {/* Table container (fills remaining space and scrolls) */}
          <Box
            borderWidth="1px"
            borderColor="#0a0b0d"
            borderRadius="md"
            flex="1"
            mt={3}
            mb={0}
            maxH="60vh"
            overflowY="auto"
            ref={scrollBoxRef}
            bg={modalBg}
          >
            <HStack
              px={4}
              py={2}
              bg="#0f1114"
              borderBottomWidth="1px"
              borderColor="#0a0b0d"
              position="sticky"
              top={0}
              zIndex={1}
            >
              <Text
                flex="0 0 90px"
                fontSize="9px"
                letterSpacing="0.16em"
                textTransform="uppercase"
                color={accentColor}
                fontWeight="bold"
              >
                d100
              </Text>
              <Text
                flex="0 0 140px"
                fontSize="9px"
                letterSpacing="0.16em"
                textTransform="uppercase"
                color={accentColor}
                fontWeight="bold"
              >
                Severity
              </Text>
              <Text
                flex="1"
                fontSize="9px"
                letterSpacing="0.16em"
                textTransform="uppercase"
                color={accentColor}
                fontWeight="bold"
              >
                Result
              </Text>
            </HStack>

            {table.map((row, idx) => {
              const isSelected = selectedIndex === idx;
              const hasPrevious = !isVehicle && ownedTitles.has(row.title.toLowerCase());
              return (
                <Box
                  key={`${row.min}-${row.max}`}
                  ref={(el) => {
                    if (el) rowsRef.current[idx] = el;
                  }}
                  position="relative"
                  bg={isSelected ? "#33363c" : idx % 2 === 0 ? rowBg : altRowBg}
                  borderBottomWidth="1px"
                  borderColor="#0a0b0d"
                  boxShadow={
                    isSelected && hasPrevious
                      ? `inset 4px 0 0 0 ${accentColor}, inset -3px 0 0 0 #7c3a2c`
                      : isSelected
                      ? `inset 4px 0 0 0 ${accentColor}`
                      : hasPrevious
                      ? `inset -3px 0 0 0 #7c3a2c`
                      : undefined
                  }
                  _hover={{bg: isSelected ? "#33363c" : "#26292d"}}
                  onClick={() => setSelectedIndex(idx)}
                  cursor="pointer"
                  transition="background-color 120ms ease, box-shadow 120ms ease"
                >
                  <HStack px={4} py={3} spacing={0} align="flex-start">
                    {/* Range */}
                    <Box flex="0 0 90px">
                      <Text fontFamily="mono">
                        {String(row.min).padStart(2, "0")}-{String(row.max).padStart(2, "0")}
                      </Text>
                    </Box>

                    {/* Severity */}
                    <Box flex="0 0 140px">
                        <HStack mt={1}>
                          {Array.from({ length: diffPips[row.severity] }).map((_, i) => (
                            <CritDieIcon key={i} />
                          ))}
                        </HStack>
                    </Box>

                    {/* Result */}
                    <Box flex="1">
                      <Text>
                        <Text
                          as="span"
                          fontWeight={isSelected ? "extrabold" : "bold"}
                        >
                          {row.title}
                        </Text>
                        <Text as="span" color={textDim}>: {row.summary}</Text>
                      </Text>
                    </Box>

                    {/* Indicator for existing injuries */}
                    <HStack flex="0 0 80px" justify="flex-end" spacing={2}>
                      {hasPrevious && (
                        <Tag size="sm" variant="subtle" bg="#7c3a2c" color="#fce7c8">
                          Sustained
                        </Tag>
                      )}
                    </HStack>
                  </HStack>
                </Box>
              );
            })}

          </Box>
        </ModalBody>
        <ModalFooter py={2} bg="#0f1114" borderTopWidth="1px" borderColor="#0a0b0d">
          <Button
            variant="ghost"
            onClick={onClose}
            _hover={{bg: "whiteAlpha.100", color: "white"}}
            color="whiteAlpha.700"
            size="xs"
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CritRollerModal
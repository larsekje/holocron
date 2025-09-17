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
import {EffectTarget, StatusFactories} from "@/types/effectTypes";
import {nanoid} from "nanoid";
import useGameplayStore from "@/state/newGameplayStore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
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

// Apply button: save injury to participant and apply a mapped effect (reusing addEffect flow)
const ApplyButton: React.FC<{
  isVehicle: boolean;
  selectedIndex: number | null;
  table: CritEntry[];
  total: number;
  selectedParticipantId: string;
}> = ({ isVehicle, selectedIndex, table, total, selectedParticipantId }) => {
  const toast = useToast();
  const { participants, addCriticalInjury } = useParticipantStore();
  const { addEffect } = useEffectStore();

  const selected = participants.find(p => p.id === selectedParticipantId);

  // Resolve entry by selected row or current total
  const resolvedIndex =
    selectedIndex !== null && table[selectedIndex]
      ? selectedIndex
      : table.findIndex(e => total >= e.min && total <= e.max);
  const entry = resolvedIndex >= 0 ? table[resolvedIndex] : undefined;
  const canApply = !!selected && !!entry;

  const handleApply = () => {
    if (!canApply || !selected || !entry) return;

    // Persist critical injury
    const injury: CritInjury = {
      id: nanoid(),
      title: entry.title,
      severity: entry.severity,
      summary: entry.summary,
      rollTotal: total,
      source: isVehicle ? "vehicle" : "personal",
      appliedAt: Date.now(),
    };
    addCriticalInjury(selected.id, injury);

    // Reuse effects flow: create an effect from StatusFactories and add it
    const target: EffectTarget = { type: "character", participantId: selected.id };
    const titleLower = entry.title.toLowerCase();

    if (titleLower.includes("stunned")) {
      const base = StatusFactories.staggered(nanoid(), target, 1);
      const eff = {
        ...base,
        apply: () => {
          toast({
            title: `Staggered applied`,
            description: `${selected.name} cannot perform actions until end of next turn.`,
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        },
      };
      addEffect(eff, target);
    } else if (titleLower.includes("head ringer") || titleLower.includes("off-balance")) {
      const base = StatusFactories.disoriented(nanoid(), target, 1, 1);
      const eff = {
        ...base,
        apply: () => {
          toast({
            title: `Disoriented 1 applied`,
            description: `${selected.name} adds 1 Setback to all checks (1 round).`,
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        },
      };
      addEffect(eff, target);
    }

    toast({
      title: "Critical Applied",
      description: `${entry.title} → ${selected.name}`,
      status: "success",
      duration: 2500,
      isClosable: true,
    });
  };

  return (
    <Button
      size="sm"
      colorScheme="cyan"
      variant="solid"
      onClick={handleApply}
      isDisabled={!canApply}
    >
      Apply
    </Button>
  );
};

// Map crit entry to an auto-applied status effect (label + kind)
// Extend as desired (only a few examples wired initially)
function mapCritToEffect(entry?: CritEntry): { label: string; kind: 'none' | 'staggered' | 'disoriented' } {
  if (!entry) return { label: 'None', kind: 'none' };
  const t = entry.title.toLowerCase();
  if (t.includes('stunned')) return { label: 'Staggered (1 round)', kind: 'staggered' };
  if (t.includes('head ringer') || t.includes('off-balance')) return { label: 'Disoriented (1)', kind: 'disoriented' };
  return { label: 'None', kind: 'none' };
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

const CritRollerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  // Dark palette harmonized with InitiativeModal
  const modalBg = "gray.800";
  const headerDivider = "gray.600";
  const rowBg = "gray.700";
  const altRowBg = "gray.650"; // Chakra will fallback toward gray.600
  const textMain = "whiteAlpha.900";
  const textDim = "whiteAlpha.700";
  const accentColor = "cyan.300";

  // Personal vs. Vehicle table toggle
  const [isVehicle, setIsVehicle] = useState(false);
  const table = isVehicle ? vehicleCritTable : critTable;

  // Shared participant selection
  const { participants } = useParticipantStore();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || "");
  // Fallback to first participant if none selected and list changes
  useEffect(() => {
    if (!selectedParticipantId && participants[0]) setSelectedParticipantId(participants[0].id);
  }, [participants.length]);

  // Default to Active participant on modal open (if available)
  const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);
  useEffect(() => {
    if (!isOpen) return;
    if (activeParticipantId && participants.some(p => p.id === activeParticipantId)) {
      setSelectedParticipantId(activeParticipantId);
    }
  }, [isOpen, activeParticipantId, participants]);

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

  useEffect(() => {
    if (base > 0) {
      const idx = findIndexFor(total);
      if (idx >= 0) {
        setSelectedIndex(idx);
        const el = rowsRef.current[idx];
        const container = scrollBoxRef.current;
        if (el && container) {
          // Center the selected row within the inner scroll box without moving the whole modal
          const target =
            el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
          container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
        }
      }
    }
  }, [base, total, isVehicle]);

  const doRoll = () => setRoll(Math.floor(Math.random() * 100) + 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="4xl">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg={modalBg} color={textMain} borderRadius="lg" boxShadow="dark-lg" maxH="85vh" overflow="hidden">
        <ModalHeader borderBottomWidth="1px" borderColor={headerDivider} py={2} px={3}>
          <HStack justify="space-between" align="center" width="100%">
            <Text fontWeight="bold">Critical Injury Table</Text>
            <HStack spacing={3} align="center">
              {/* Target (participant) selector - only for Personal mode */}
              {!isVehicle && (
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
                  colorScheme="cyan"
                  size="sm"
                  sx={{
                    "& .chakra-switch__track": {
                      bg: isVehicle ? "cyan.400" : "purple.400",
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
            borderColor="gray.700"
            borderRadius="md"
            bg="gray.900"
          >
            <HStack spacing={3} flexWrap="wrap" align="center">


              <Button size="sm" colorScheme="purple" onClick={doRoll}>
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
                            {mapCritToEffect(table[selectedIndex]).label}
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
                  <ApplyButton
                    isVehicle={isVehicle}
                    selectedIndex={selectedIndex}
                    table={table}
                    total={total}
                    selectedParticipantId={selectedParticipantId}
                  />
                )}
            </HStack>
          </Box>

          {/* Table container (fills remaining space and scrolls) */}
          <Box
            borderWidth="1px"
            borderColor="gray.700"
            borderRadius="md"
            flex="1"
            mt={3}
            mb={0}
            maxH="60vh"
            overflowY="auto"
            ref={scrollBoxRef}
          >
            <HStack
              px={4}
              py={2}
              bg="gray.900"
              borderBottomWidth="1px"
              borderColor="gray.700"
              position="sticky"
              top={0}
              zIndex={1}
            >
              <Text flex="0 0 90px" fontSize="sm" color={textDim} letterSpacing="wider">d100</Text>
              <Text flex="0 0 140px" fontSize="sm" color={textDim} letterSpacing="wider">Severity</Text>
              <Text flex="1" fontSize="sm" color={textDim} letterSpacing="wider">Result</Text>
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
                  bg={isSelected ? "gray.500" : idx % 2 === 0 ? rowBg : "gray.600"}
                  borderBottomWidth="1px"
                  borderColor="gray.650"
                  boxShadow={
                    isSelected && hasPrevious
                      ? `inset 4px 0 0 0 ${accentColor}, inset -3px 0 0 0 #9F7AEA, 0 0 0 1px rgba(255,255,255,0.06)`
                      : isSelected
                      ? `inset 4px 0 0 0 ${accentColor}, 0 0 0 1px rgba(255,255,255,0.06)`
                      : hasPrevious
                      ? `inset -3px 0 0 0 #9F7AEA`
                      : undefined
                  }
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
                        <Tag size="sm" variant="subtle" colorScheme="gray">
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
        <ModalFooter py={2}>
          <Button
            variant="ghost"
            onClick={onClose}
            _hover={{ bg: "whiteAlpha.100" }}
            color="#d4af37"
            size="sm"
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CritRollerModal
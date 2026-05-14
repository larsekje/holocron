import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Kbd,
  Portal,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from "@chakra-ui/react";
import { TriangleUpIcon, TriangleDownIcon, CheckCircleIcon, TimeIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { Participant } from "@/state/participantsStore";
import { StatusFactories, EffectTarget } from "@/types/effectTypes";
import { useEffectStore } from "@/state/effectStore";
import { useEffectReminder } from "@/hooks/useEffectReminder";
import { nanoid } from "nanoid";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
};

type EffectStatusKey =
  | "immobilized"
  | "burn"
  | "prone"
  | "disoriented"
  | "ensnared"
  | "staggered";

interface StepperBinding {
  value: number;
  set: (v: number) => void;
  min?: number;
}

// Palette aligned with the main view (ContentCardOld / session-prep cards).
const MODAL_BG = "#2A2C30";
const CARD_BG = "#26292d";
const INFO_BG = "#1a1c1e";
const BORDER_DIM = "whiteAlpha.100";
const TEXT = "whiteAlpha.900";
const TEXT_DIM = "whiteAlpha.700";
const APPLIED_ACCENT = "#3a7e57"; // single neutral "applied/on" green
const CURSOR_ACCENT = "#5a7fb0"; // keyboard cursor highlight — session-prep blue

// Footer key-hint chip — explicit colors so it never collapses to
// white-on-white on the dark modal (Chakra's default Kbd does).
const HintKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Kbd bg="#1f2225" color="whiteAlpha.800" borderColor="whiteAlpha.300" fontSize="2xs">
    {children}
  </Kbd>
);

const ApplyEffectsModal: React.FC<Props> = ({ isOpen, onClose, participant }) => {
  const { effects, addEffect, removeEffect } = useEffectStore();
  const wrapEffect = useEffectReminder();

  // Compact parameters with sensible defaults
  const [immDuration, setImmDuration] = useState<number>(2);
  const [burnRank, setBurnRank] = useState<number>(3);
  const [burnDuration, setBurnDuration] = useState<number>(5);
  const [disRank, setDisRank] = useState<number>(1);
  const [disDuration, setDisDuration] = useState<number>(2);
  const [ensDuration, setEnsDuration] = useState<number>(1);
  const [stagDuration, setStagDuration] = useState<number>(2);

  // Keyboard cursor — which effect row is "focused" for ↑/↓/Enter/←/→.
  const [cursor, setCursor] = useState(0);
  useEffect(() => {
    if (isOpen) setCursor(0);
  }, [isOpen]);

  const target: EffectTarget = { type: "character", participantId: participant.id };

  const findExisting = (status: EffectStatusKey) => {
    const matches = effects.filter(
      (e) =>
        e.target.type === "character" &&
        e.target.participantId === participant.id &&
        e.effect.status === status
    );
    return matches[matches.length - 1];
  };

  const removeAllOf = (status: EffectStatusKey) => {
    effects
      .filter(
        (e) =>
          e.target.type === "character" &&
          e.target.participantId === participant.id &&
          e.effect.status === status
      )
      .forEach((e) => removeEffect(e.id));
  };

  // All addX helpers route through wrapEffect: actionable statuses (Burn,
  // Bleeding Out, At the Brink) get a sidebar reminder on each trigger;
  // passive markers pass through unwrapped — the chip is the reminder. The
  // "X is now …" timeline entry comes from effectStore's addEffect hook, so
  // no toast is needed here.
  const addImmobilized = () => {
    const raw = StatusFactories.immobilized(nanoid(), target, immDuration);
    addEffect(wrapEffect(raw, participant.name), target);
  };

  const addBurn = () => {
    const raw = StatusFactories.burn(nanoid(), target, burnRank, burnDuration);
    addEffect(wrapEffect(raw, participant.name), target);
  };

  const addProne = () => {
    const raw = StatusFactories.prone(nanoid(), target);
    addEffect(wrapEffect(raw, participant.name), target);
  };

  const addDisoriented = () => {
    const raw = StatusFactories.disoriented(nanoid(), target, disRank, disDuration);
    addEffect(wrapEffect(raw, participant.name), target);
  };

  const addEnsnared = () => {
    const raw = StatusFactories.ensnared(nanoid(), target, ensDuration, ensDuration);
    addEffect(wrapEffect(raw, participant.name), target);
  };

  const addStaggered = () => {
    const raw = StatusFactories.staggered(nanoid(), target, stagDuration);
    addEffect(wrapEffect(raw, participant.name), target);
  };

  // Ultra-compact up/down arrow stepper that stays within text height
  const MiniStepper = ({
    value,
    setValue,
    min = 1,
    max,
  }: {
    value: number;
    setValue: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <HStack spacing={1} onClick={(e) => e.stopPropagation()} align="center" flexShrink={0}>
      <Text fontWeight="bold" minW="10px" textAlign="center" lineHeight="1" color={TEXT}>
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
          onClick={() =>
            setValue(Math.min(max ?? Number.MAX_SAFE_INTEGER, (value || min) + 1))
          }
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="50%"
          w="100%"
          _hover={{ bg: "whiteAlpha.200" }}
        >
          <TriangleUpIcon boxSize="0.5em" color="whiteAlpha.700" />
        </Box>
        <Box
          as="button"
          aria-label="decrease"
          onClick={() => setValue(Math.max(min, (value || min) - 1))}
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="50%"
          w="100%"
          _hover={{ bg: "whiteAlpha.200" }}
        >
          <TriangleDownIcon boxSize="0.5em" color="whiteAlpha.700" />
        </Box>
      </Box>
    </HStack>
  );

  // Short rule summaries for info popover
  const infoByStatus: Record<EffectStatusKey, React.ReactNode> = {
    immobilized: (
      <Text fontSize="sm">
        The target cannot perform maneuvers while this lasts. They may still perform actions.
      </Text>
    ),
    burn: (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">
          Target suffers X wounds at the specified trigger each round until the effect ends or is extinguished.
        </Text>
        <Text fontSize="sm" color="whiteAlpha.600">
          GM may allow actions or environmental factors to end the burning early.
        </Text>
      </VStack>
    ),
    prone: (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">Standing up costs one maneuver.</Text>
        <Text fontSize="sm" color="whiteAlpha.600">Common tables: harder to hit with ranged attacks, easier with melee.</Text>
      </VStack>
    ),
    disoriented: (
      <Text fontSize="sm">Suffers Setback on all checks equal to the rank while it lasts.</Text>
    ),
    ensnared: (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">Cannot perform maneuvers while ensnared. Duration often equals rank.</Text>
        <Text fontSize="sm" color="whiteAlpha.600">Breaking free may require a check or spending resources at GM’s discretion.</Text>
      </VStack>
    ),
    staggered: (
      <Text fontSize="sm">Cannot perform actions while staggered. Maneuvers are still allowed.</Text>
    ),
  };

  // Row definitions — single source of truth for both the rendered rows and
  // the keyboard handler. `steppers` is ordered: ←/→ drives the first,
  // Shift+←/→ the second (Burn / Disoriented have two).
  interface RowDef {
    key: EffectStatusKey;
    title: string;
    description: React.ReactNode;
    onApply: () => void;
    steppers: StepperBinding[];
  }
  const rowDefs: RowDef[] = [
    {
      key: "immobilized",
      title: "Immobilized",
      description: (
        <>
          <Text>Cannot perform maneuvers for</Text>
          <MiniStepper value={immDuration} setValue={setImmDuration} />
          <Text>rounds.</Text>
        </>
      ),
      onApply: addImmobilized,
      steppers: [{ value: immDuration, set: setImmDuration, min: 1 }],
    },
    {
      key: "burn",
      title: "Burn",
      description: (
        <>
          <Text>Deal</Text>
          <MiniStepper value={burnRank} setValue={setBurnRank} />
          <Text>wounds for</Text>
          <MiniStepper value={burnDuration} setValue={setBurnDuration} />
          <Text>rounds.</Text>
        </>
      ),
      onApply: addBurn,
      steppers: [
        { value: burnRank, set: setBurnRank, min: 1 },
        { value: burnDuration, set: setBurnDuration, min: 1 },
      ],
    },
    {
      key: "prone",
      title: "Prone",
      description: <Text>Stand up with a maneuver; melee/ranged modifiers apply.</Text>,
      onApply: addProne,
      steppers: [],
    },
    {
      key: "disoriented",
      title: "Disoriented",
      description: (
        <>
          <Text>Add</Text>
          <MiniStepper value={disRank} setValue={setDisRank} />
          <Text>Setback to all checks for</Text>
          <MiniStepper value={disDuration} setValue={setDisDuration} />
          <Text>rounds.</Text>
        </>
      ),
      onApply: addDisoriented,
      steppers: [
        { value: disRank, set: setDisRank, min: 1 },
        { value: disDuration, set: setDisDuration, min: 1 },
      ],
    },
    {
      key: "ensnared",
      title: "Ensnared",
      description: (
        <>
          <Text>Cannot perform maneuvers for</Text>
          <MiniStepper value={ensDuration} setValue={setEnsDuration} />
          <Text>rounds.</Text>
        </>
      ),
      onApply: addEnsnared,
      steppers: [{ value: ensDuration, set: setEnsDuration, min: 1 }],
    },
    {
      key: "staggered",
      title: "Staggered",
      description: (
        <>
          <Text>Cannot perform actions for</Text>
          <MiniStepper value={stagDuration} setValue={setStagDuration} />
          <Text>rounds.</Text>
        </>
      ),
      onApply: addStaggered,
      steppers: [{ value: stagDuration, set: setStagDuration, min: 1 }],
    },
  ];

  const toggleRow = (def: RowDef) => {
    if (findExisting(def.key)) {
      removeAllOf(def.key);
    } else {
      def.onApply();
    }
  };

  // The keydown listener is attached once per open; it reads the latest
  // cursor + rowDefs + onClose through a ref so it never goes stale and we
  // don't re-bind on every render.
  const liveRef = useRef({ cursor, rowDefs, toggleRow, onClose });
  liveRef.current = { cursor, rowDefs, toggleRow, onClose };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Esc always closes — handled here because the modal opens with
      // autoFocus={false}, so focus never enters it and Chakra's own
      // closeOnEsc handler never fires.
      if (e.key === "Escape") {
        e.preventDefault();
        liveRef.current.onClose();
        return;
      }

      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const { cursor, rowDefs, toggleRow } = liveRef.current;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(rowDefs.length - 1, c + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const def = rowDefs[cursor];
        if (def) toggleRow(def);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const steppers = rowDefs[cursor]?.steppers ?? [];
        const stepper = e.shiftKey ? steppers[1] : steppers[0];
        if (stepper) {
          e.preventDefault();
          stepper.set(Math.max(stepper.min ?? 1, stepper.value + dir));
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // A full-width effect row — icon · title (+ applied indicator) · description.
  const EffectRow = ({
    def,
    isCursor,
    onHover,
  }: {
    def: RowDef;
    isCursor: boolean;
    onHover: () => void;
  }) => {
    const existing = findExisting(def.key);
    const applied = !!existing;
    const remaining = existing?.remainingDuration;
    const infoContent = infoByStatus[def.key];

    return (
      <Box
        onClick={() => toggleRow(def)}
        onMouseEnter={onHover}
        bg={CARD_BG}
        _hover={{ bg: "#2c2f34" }}
        borderRadius="md"
        pl={3}
        pr={3}
        py={2}
        cursor="pointer"
        borderWidth="1px"
        borderColor={isCursor ? CURSOR_ACCENT : BORDER_DIM}
        // Applied → inset green accent bar; cursor → full blue ring.
        boxShadow={
          isCursor
            ? `0 0 0 1px ${CURSOR_ACCENT}`
            : applied
            ? `inset 3px 0 0 0 ${APPLIED_ACCENT}`
            : undefined
        }
        transition="background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease"
      >
        <HStack align="flex-start" spacing={2.5}>
          <VStack align="stretch" spacing={0.5} flex="1" minW={0}>
            <HStack spacing={1.5} align="center">
              <Text fontWeight="bold" color={TEXT} fontSize="sm">
                {def.title}
              </Text>
              {infoContent && (
                <Popover placement="right" isLazy>
                  <PopoverTrigger>
                    <IconButton
                      aria-label="Effect info"
                      icon={<InfoOutlineIcon boxSize={2.5} />}
                      size="xs"
                      h="16px"
                      minW="16px"
                      variant="ghost"
                      color="whiteAlpha.500"
                      _hover={{ color: "whiteAlpha.900", bg: "transparent" }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </PopoverTrigger>
                  {/* Portal out — the modal body clips inline popovers. */}
                  <Portal>
                    <PopoverContent
                      w="sm"
                      bg={INFO_BG}
                      color={TEXT}
                      borderColor="whiteAlpha.200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PopoverArrow bg={INFO_BG} />
                      <PopoverCloseButton />
                      <PopoverHeader fontWeight="bold" borderBottomWidth="1px" borderColor="whiteAlpha.150">
                        {def.title}
                      </PopoverHeader>
                      <PopoverBody>{infoContent}</PopoverBody>
                    </PopoverContent>
                  </Portal>
                </Popover>
              )}
              <Box flex="1" />
              {/* Applied indicator, inline on the title row. */}
              {applied &&
                (typeof remaining === "number" ? (
                  <HStack spacing={1} color={APPLIED_ACCENT} flexShrink={0}>
                    <TimeIcon boxSize={3} />
                    <Text fontSize="xs" fontWeight="semibold">
                      {remaining}
                    </Text>
                  </HStack>
                ) : (
                  <CheckCircleIcon color={APPLIED_ACCENT} boxSize={3.5} flexShrink={0} />
                ))}
            </HStack>
            <HStack
              spacing={1.5}
              rowGap={1}
              color={TEXT_DIM}
              fontSize="xs"
              align="center"
              flexWrap="wrap"
            >
              {def.description}
            </HStack>
          </VStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered autoFocus={false}>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg={MODAL_BG}
        color={TEXT}
        borderRadius="md"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        boxShadow="dark-lg"
      >
        <ModalHeader borderBottomWidth="1px" borderColor={BORDER_DIM} fontSize="md" py={3}>
          Apply Effects to {participant.name}
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.600" _hover={{ color: "white", bg: "whiteAlpha.100" }} />
        <ModalBody py={3}>
          <VStack align="stretch" spacing={1.5}>
            {rowDefs.map((def, idx) => (
              <EffectRow
                key={def.key}
                def={def}
                isCursor={cursor === idx}
                onHover={() => setCursor(idx)}
              />
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent="space-between" borderTopWidth="1px" borderColor={BORDER_DIM} py={2.5}>
          <HStack spacing={3} fontSize="2xs" color="whiteAlpha.500">
            <HStack spacing={1}><HintKey>↑</HintKey><HintKey>↓</HintKey><Text>row</Text></HStack>
            <HStack spacing={1}><HintKey>↵</HintKey><Text>toggle</Text></HStack>
            <HStack spacing={1}><HintKey>←</HintKey><HintKey>→</HintKey><Text>adjust</Text></HStack>
          </HStack>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            color="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ApplyEffectsModal;

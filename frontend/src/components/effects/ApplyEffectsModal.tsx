import React, { useState } from "react";
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
  Divider,
  useToast,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Tooltip,
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
  | "staggered"
  | "knocked-down";

const ApplyEffectsModal: React.FC<Props> = ({ isOpen, onClose, participant }) => {
  const toast = useToast();
  const { effects, addEffect, removeEffect } = useEffectStore();
  const wrapEffect = useEffectReminder();

  // Dark mode palette (aligned with Initiative modal)
  const modalBg = "gray.800";
  const cardBg = "gray.700";
  const infoBg = "gray.900";
  const textColor = "whiteAlpha.900";
  const secondaryTextColor = "whiteAlpha.700";
  const accentColor = "cyan.300";

  // Compact parameters with sensible defaults
  const [immDuration, setImmDuration] = useState<number>(2);
  const [burnRank, setBurnRank] = useState<number>(3);
  const [burnDuration, setBurnDuration] = useState<number>(5);
  const [disRank, setDisRank] = useState<number>(1);
  const [disDuration, setDisDuration] = useState<number>(2);
  const [ensRank, setEnsRank] = useState<number>(1);
  const [ensDuration, setEnsDuration] = useState<number>(1);
  const [stagDuration, setStagDuration] = useState<number>(2);

  const target: EffectTarget = { type: "character", participantId: participant.id };

  // Find existing effect for a given status for this participant
  const findExisting = (status: EffectStatusKey) => {
    const matches = effects.filter(
      (e) =>
        e.target.type === "character" &&
        e.target.participantId === participant.id &&
        e.effect.status === (status === "knocked-down" ? "prone" : status)
    );
    return matches[matches.length - 1];
  };

  const removeAllOf = (status: EffectStatusKey) => {
    effects
      .filter(
        (e) =>
          e.target.type === "character" &&
          e.target.participantId === participant.id &&
          e.effect.status === (status === "knocked-down" ? "prone" : status)
      )
      .forEach((e) => removeEffect(e.id));
  };

  const successToast = (msg: string) =>
    toast({
      title: "Effect",
      description: msg,
      status: "success",
      duration: 1200,
      isClosable: true,
    });

  // All addX helpers route through wrapEffect: actionable statuses (Burn,
  // Bleeding Out, At the Brink) get a sidebar reminder on each trigger;
  // passive markers (Immobilized, Prone, Disoriented, Ensnared, Staggered)
  // pass through unwrapped — the chip is the reminder. The "X is now …"
  // timeline entry comes from effectStore's addEffect logging hook.
  const addImmobilized = () => {
    const raw = StatusFactories.immobilized(nanoid(), target, immDuration);
    addEffect(wrapEffect(raw, participant.name), target);
    successToast(`IMMOBILIZED (${immDuration} rounds) → ${participant.name}`);
  };

  const addBurn = () => {
    const raw = StatusFactories.burn(nanoid(), target, burnRank, burnDuration);
    addEffect(wrapEffect(raw, participant.name), target);
    successToast(`BURN ${burnRank} (${burnDuration} rounds) → ${participant.name}`);
  };

  const addProne = () => {
    const raw = StatusFactories.prone(nanoid(), target);
    addEffect(wrapEffect(raw, participant.name), target);
    successToast(`PRONE → ${participant.name}`);
  };

  const addDisoriented = () => {
    const raw = StatusFactories.disoriented(nanoid(), target, disRank, disDuration);
    addEffect(wrapEffect(raw, participant.name), target);
    successToast(`DISORIENTED ${disRank} (${disDuration}) → ${participant.name}`);
  };

  const addEnsnared = () => {
    const raw = StatusFactories.ensnared(nanoid(), target, ensRank, ensDuration);
    const displayDuration = raw.duration ?? ensRank;
    addEffect(wrapEffect(raw, participant.name), target);
    successToast(`ENSNARED ${ensRank} (${displayDuration}) → ${participant.name}`);
  };

  const addStaggered = () => {
    const raw = StatusFactories.staggered(nanoid(), target, stagDuration);
    addEffect(wrapEffect(raw, participant.name), target);
    successToast(`STAGGERED (${stagDuration}) → ${participant.name}`);
  };

  const addKnockedDown = () => {
    addProne();
    successToast(`KNOCKED DOWN → ${participant.name}`);
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
    <HStack spacing={1} onClick={(e) => e.stopPropagation()} align="center">
      <Text fontWeight="semibold" minW="10px" textAlign="center" lineHeight="1" color={textColor}>
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
          _hover={{ bg: "transparent" }}
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
          _hover={{ bg: "transparent" }}
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
        <Text fontSize="sm" color="gray.600">
          GM may allow actions or environmental factors to end the burning early.
        </Text>
      </VStack>
    ),
    prone: (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">Standing up costs one maneuver.</Text>
        <Text fontSize="sm" color="gray.600">Common tables: harder to hit with ranged attacks, easier with melee.</Text>
      </VStack>
    ),
    disoriented: (
      <Text fontSize="sm">Suffers Setback on all checks equal to the rank while it lasts.</Text>
    ),
    ensnared: (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">Cannot perform maneuvers while ensnared. Duration often equals rank.</Text>
        <Text fontSize="sm" color="gray.600">Breaking free may require a check or spending resources at GM’s discretion.</Text>
      </VStack>
    ),
    staggered: (
      <Text fontSize="sm">Cannot perform actions while staggered. Maneuvers are still allowed.</Text>
    ),
    "knocked-down": (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">Target is knocked off their feet; treat as Prone.</Text>
        <Text fontSize="sm" color="gray.600">Stand up with a maneuver.</Text>
      </VStack>
    ),
  };

  // A generic row for an effect (click to toggle) — stable layout, no text shift
  const EffectRow = ({
    statusKey,
    title,
    description,
    onApply,
  }: {
    statusKey: EffectStatusKey;
    title: string;
    description: React.ReactNode;
    onApply: () => void;
  }) => {
    const existing = findExisting(statusKey);
    const applied = !!existing;
    const remaining = existing?.remainingDuration;

    const toggle = () => {
      if (applied) {
        removeAllOf(statusKey);
        successToast(`${title} removed from ${participant.name}`);
      } else {
        onApply();
      }
    };

    const infoContent = infoByStatus[statusKey];

    return (
      <Box
        onClick={toggle}
        bg={cardBg}
        _hover={{ bg: "gray.600" }}
        borderRadius="md"
        px={3}
        py={2}
        borderWidth="1px"
        borderColor="gray.600"
        position="relative"
        overflow="hidden"
        // Left accent via pseudo-element (follows rounded edges, no layout shift)
        _before={{
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: applied ? "3px" : "1px",
          backgroundColor: applied ? accentColor : "gray.600",
          borderTopLeftRadius: "inherit",
          borderBottomLeftRadius: "inherit",
          pointerEvents: "none",
        }}
        transition="background-color 120ms ease"
      >
        <HStack align="flex-start" spacing={3}>
          <VStack align="start" spacing={0}>
            <HStack spacing={2} align="center">
              <Text fontWeight="bold" color={textColor}>{title}</Text>
              {infoContent && (
                <Popover placement="right" isLazy>
                  <PopoverTrigger>
                    <IconButton
                      aria-label="Effect info"
                      icon={<InfoOutlineIcon boxSize={3} />}
                      size="xs"
                      variant="ghost"
                      color="whiteAlpha.700"
                      _hover={{ color: "whiteAlpha.900", bg: "transparent" }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    w="sm"
                    bg={infoBg}
                    color={textColor}
                    borderColor="gray.600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader fontWeight="bold" borderBottomWidth="1px" borderColor="gray.700">
                      {title}
                    </PopoverHeader>
                    <PopoverBody>{infoContent}</PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
            </HStack>
            <HStack spacing={2} color={secondaryTextColor} fontSize="sm" align="center">
              {description}
            </HStack>
          </VStack>
          <Box flex="1" />
          {/* Fixed-width status column to avoid width changes */}
          <Box minW="44px" textAlign="right">
            {applied ? (
              typeof remaining === "number" ? (
                <HStack spacing={1} color={accentColor} justify="flex-end">
                  <TimeIcon boxSize={3.5} />
                  <Text fontSize="sm" fontWeight="semibold">{remaining}</Text>
                </HStack>
              ) : (
                <CheckCircleIcon color={accentColor} boxSize={4} />
              )
            ) : (
              <Box h="18px" />
            )}
          </Box>
        </HStack>
      </Box>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg={modalBg} color={textColor} borderRadius="lg" boxShadow="dark-lg">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.600">
          Apply Effects to {participant.name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={2}>
            <EffectRow
              statusKey="immobilized"
              title="Immobilized"
              description={
                <>
                  <Text>Cannot perform maneuvers for</Text>
                  <MiniStepper value={immDuration} setValue={setImmDuration} />
                  <Text>rounds.</Text>
                </>
              }
              onApply={addImmobilized}
            />

            <EffectRow
              statusKey="burn"
              title="Burn"
              description={
                <>
                  <Text>Deal</Text>
                  <MiniStepper value={burnRank} setValue={setBurnRank} />
                  <Text>wounds for</Text>
                  <MiniStepper value={burnDuration} setValue={setBurnDuration} />
                  <Text>rounds.</Text>
                </>
              }
              onApply={addBurn}
            />

            <EffectRow
              statusKey="prone"
              title="Prone"
              description={<Text>Stand up with a maneuver; melee/ranged modifiers apply.</Text>}
              onApply={addProne}
            />

            <EffectRow
              statusKey="disoriented"
              title="Disoriented"
              description={
                <>
                  <Text>Add</Text>
                  <MiniStepper value={disRank} setValue={setDisRank} />
                  <Text>Setback to all checks for</Text>
                  <MiniStepper value={disDuration} setValue={setDisDuration} />
                  <Text>rounds.</Text>
                </>
              }
              onApply={addDisoriented}
            />

            <EffectRow
              statusKey="ensnared"
              title="Ensnared"
              description={
                <>
                  <Text>Cannot perform maneuvers for</Text>
                  <MiniStepper value={ensDuration} setValue={setEnsDuration} />
                  <Text>rounds</Text>

                </>
              }
              onApply={addEnsnared}
            />

            <EffectRow
              statusKey="staggered"
              title="Staggered"
              description={
                <>
                  <Text>Cannot perform actions for</Text>
                  <MiniStepper value={stagDuration} setValue={setStagDuration} />
                  <Text>rounds.</Text>
                </>
              }
              onApply={addStaggered}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ApplyEffectsModal;

import React from "react";
import { Box, Flex, keyframes, Text, VStack } from "@chakra-ui/react";
import { getSyncBaseUrl } from "@/sync/syncBaseUrl";
import { postAction } from "@/sync/postAction";
import type { PlayerSnapshot } from "@/sync/snapshot";
import Starfield from "./Starfield";
import PlayerInitiativeBar from "./PlayerInitiativeBar";
import PlayerRound from "./PlayerRound";
import PlayerRoster from "./PlayerRoster";
import PlayerSkillChallengeView from "./PlayerSkillChallengeView";
import PlayerImage from "./PlayerImage";
import PlayerDestiny from "./PlayerDestiny";
import PlayerRollReveal from "./PlayerRollReveal";
import PlayerTurnControls from "./PlayerTurnControls";

/**
 * The read-only-ish, real-time player view. Selected in main.tsx via
 * ?pcview=<id>. It reads GM state over SSE and can send a couple of actions
 * back (flip Destiny, advance the turn from a PC slot).
 *
 * HARD RULE: this component and its children import NO zustand store. A player
 * device never loads GM state or touches localStorage. Inputs are the SSE
 * snapshot, the relay base URL, and the action poster.
 */
type Conn = "connecting" | "open" | "reconnecting";

const pulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const lightboxIn = keyframes`
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
`;

// In-universe holding-screen flavor, rotated while idle.
const IDLE_LINES = [
  "May the Force be with you",
  "One way out.",
  "Never tell me the odds.",
  "Fear is the path to the dark side.",
  "Stay on target…",
  "I have a bad feeling about this.",
  "This is the way",
  "Patience you must have.",
  "Always in motion is the future.",
  "I burn my life to make a sunrise that I know I'll never see.",
];
const IDLE_ROTATE_MS = 20000;

const PlayerView: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [snap, setSnap] = React.useState<PlayerSnapshot | null>(null);
  const [conn, setConn] = React.useState<Conn>("connecting");
  const [lineIdx, setLineIdx] = React.useState(() =>
    Math.floor(Math.random() * IDLE_LINES.length),
  );

  React.useEffect(() => {
    const es = new EventSource(`${getSyncBaseUrl()}/sync/${roomId}/stream`);
    es.onopen = () => setConn("open");
    es.onmessage = (e) => {
      try {
        setSnap(JSON.parse(e.data) as PlayerSnapshot);
        setConn("open");
      } catch {
        // keepalive comment or malformed frame — ignore
      }
    };
    es.onerror = () => setConn("reconnecting"); // EventSource auto-reconnects
    return () => es.close();
  }, [roomId]);

  React.useEffect(() => {
    const id = setInterval(
      () => setLineIdx((i) => (i + 1) % IDLE_LINES.length),
      IDLE_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  const flip = React.useCallback(
    (index: number) => postAction(roomId, { type: "flipDestiny", index }),
    [roomId],
  );
  const setActive = React.useCallback(
    (participantId: string) =>
      postAction(roomId, { type: "setActive", participantId }),
    [roomId],
  );
  const endTurn = React.useCallback(
    () => postAction(roomId, { type: "endTurn" }),
    [roomId],
  );

  const inCombat =
    snap !== null && snap.fsmState === "inProgress" && snap.slots.length > 0;
  const challenge = snap?.skillChallenge ?? null;
  const display = snap?.display ?? null;

  // Turn-control state (combat only).
  const activeParticipant = snap?.participants.find((p) => p.active) ?? null;
  const activeSlotTeam = snap?.slots[snap.currentTurnIndex]?.team;
  const openPcSlot = inCombat && activeSlotTeam === "PC" && !activeParticipant;
  const eligiblePcs = (snap?.participants ?? [])
    .filter((p) => p.team === "PC" && !p.down && !p.acted)
    .map((p) => ({ id: p.id, name: p.name }));
  // With a single eligible PC there's nothing to ask — auto-select them.
  const soloPickId =
    openPcSlot && eligiblePcs.length === 1 ? eligiblePcs[0].id : null;
  const picks = openPcSlot && eligiblePcs.length > 1 ? eligiblePcs : null;
  const endTurnName =
    inCombat && activeParticipant && activeParticipant.team === "PC"
      ? activeParticipant.name
      : null;

  React.useEffect(() => {
    if (soloPickId) setActive(soloPickId);
  }, [soloPickId, setActive]);

  let content: React.ReactNode;
  if (snap === null) {
    content = (
      <Text
        fontSize={["xl", "2xl"]}
        color="whiteAlpha.700"
        animation={`${pulse} 2.4s ease-in-out infinite`}
        letterSpacing="0.06em"
      >
        {conn === "reconnecting" ? "Reconnecting…" : "Establishing link…"}
      </Text>
    );
  } else if (challenge) {
    content = <PlayerSkillChallengeView challenge={challenge} />;
  } else if (inCombat) {
    content = (
      <VStack spacing={[6, 8, 10]} px={2} w="100%">
        <PlayerRound round={snap.round} />
        <PlayerInitiativeBar slots={snap.slots} />
        <PlayerRoster
          participants={snap.participants}
          pickableIds={openPcSlot ? new Set(eligiblePcs.map((p) => p.id)) : undefined}
          onPick={setActive}
        />
        <PlayerTurnControls
          picks={picks}
          activeName={endTurnName}
          onPick={setActive}
          onEndTurn={endTurn}
        />
      </VStack>
    );
  } else {
    // Idle — rotating in-universe holding screen.
    content = (
      <VStack spacing={3} textAlign="center">
        <Text
          fontSize={["3xl", "4xl", "5xl"]}
          fontWeight="extrabold"
          color="whiteAlpha.900"
          letterSpacing="0.08em"
          textShadow="0 0 30px rgba(120,150,255,0.35)"
        >
          Holocron
        </Text>
        <Text
          key={lineIdx}
          fontSize={["md", "lg", "xl"]}
          color="whiteAlpha.700"
          fontStyle="italic"
          letterSpacing="0.04em"
          maxW="80vw"
          animation={`${fadeIn} 1.2s ease-in`}
        >
          {IDLE_LINES[lineIdx]}
        </Text>
      </VStack>
    );
  }

  return (
    <Box minH="100vh" bg="#03040a" color="white" position="relative" overflow="hidden">
      <Starfield />

      {/* Center — main content, vertically centered in the full viewport. */}
      <Flex
        position="relative"
        zIndex={1}
        minH="100vh"
        direction="column"
        align="center"
        justify="center"
        px={2}
        py={4}
      >
        {content}
      </Flex>

      {/* Top overlay — Destiny + revealed roll. Absolute so it never pushes the
          centered content down (reserved space, not flow). */}
      <VStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={2}
        spacing={3}
        pt={4}
        px={2}
        pointerEvents="none"
      >
        {snap && snap.destiny.length > 0 && (
          <PlayerDestiny pool={snap.destiny} onFlip={flip} />
        )}
        {snap?.roll && <PlayerRollReveal roll={snap.roll} />}
      </VStack>

      {/* GM-pushed image — a "this is how it looks" lightbox over everything.
          Appears regardless of state and is GM-controlled (cleared from the
          Share modal). */}
      {display && (
        <Flex
          key={display.imageUrl}
          position="fixed"
          inset={0}
          zIndex={20}
          align="center"
          justify="center"
          px={4}
          py={6}
          bg="blackAlpha.800"
          backdropFilter="blur(8px)"
          animation={`${fadeIn} 0.25s ease-out`}
        >
          <Box animation={`${lightboxIn} 0.3s ease-out`}>
            <PlayerImage display={display} />
          </Box>
        </Flex>
      )}

      {/* Connection hint — quiet, top-right, only while reconnecting. */}
      {conn === "reconnecting" && snap !== null && (
        <Box
          position="fixed"
          top={3}
          right={3}
          zIndex={3}
          px={3}
          py={1}
          borderRadius="full"
          bg="blackAlpha.600"
          borderWidth="1px"
          borderColor="orange.400"
        >
          <Text fontSize="xs" color="orange.300">
            Reconnecting…
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PlayerView;

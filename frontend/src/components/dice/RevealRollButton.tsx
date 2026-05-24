import React from "react";
import { Button, Tooltip } from "@chakra-ui/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import type { ModalSnapshot } from "@components/dice/mockSnapshots";
import useDiceRollerStore from "@/state/diceRollerStore";
import useShareStore from "@/state/shareStore";
import useRevealedRollStore from "@/state/revealedRollStore";
import type { PlayerRoll } from "@/sync/snapshot";

/**
 * "Reveal to players" — pushes the current dice result to the synced player
 * view; toggles to "Hide" once shown (fixed width so the row doesn't reflow).
 * Sits inline with Re-roll / Pass. Only shown while sharing is active and once
 * a result exists, so GM rolls stay private until explicitly revealed.
 */
function toPlayerRoll(snap: ModalSnapshot): PlayerRoll {
  const net = snap.result?.net;
  const poly = snap.polyResult;
  return {
    label: snap.attacker?.name ?? snap.label ?? "GM Roll",
    netSuccess: net?.netSuccess ?? 0,
    netAdvantage: net?.netAdvantage ?? 0,
    triumph: net?.triumph ?? 0,
    despair: net?.despair ?? 0,
    poly: poly
      ? { total: poly.total, values: poly.rolls.map((r) => r.value) }
      : undefined,
    at: Date.now(),
  };
}

const RevealRollButton: React.FC = () => {
  const snapshot = useDiceRollerStore((s) => s.snapshot);
  const isSharing = useShareStore((s) => s.isSharing);
  const reveal = useRevealedRollStore((s) => s.reveal);
  const clear = useRevealedRollStore((s) => s.clear);
  const shown = useRevealedRollStore((s) => s.roll !== null);

  if (!isSharing || !snapshot) return null;
  if (!snapshot.result && !snapshot.polyResult) return null;

  return (
    <Tooltip
      label={shown ? "Hide from players" : "Show this result on the players' screens"}
      placement="top"
      hasArrow
      openDelay={300}
    >
      <Button
        size="md"
        minW="120px"
        variant="outline"
        colorScheme="orange"
        leftIcon={shown ? <FiEyeOff /> : <FiEye />}
        onClick={() => (shown ? clear() : reveal(toPlayerRoll(snapshot)))}
      >
        {shown ? "Hide" : "Reveal"}
      </Button>
    </Tooltip>
  );
};

export default RevealRollButton;

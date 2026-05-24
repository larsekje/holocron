import { disabledSlotIndices } from "@/utils/initiativeSlots";
import { isParticipantDead } from "@/state/participantsStore";
import type { EncounterContext } from "@/state/FSM";
import type { Participant } from "@/state/participantsStore";
import type { SkillChallengeState } from "@/state/skillChallengeStore";

/**
 * The payload the GM ships to player views. It carries what the table should
 * see: initiative slots, a participant roster (names + acted/active/down), the
 * round, any active skill challenge, and an optional GM-pushed image. No combat
 * stats (soak, defenses, wound numbers) ever cross — just names and status.
 */
export const SNAPSHOT_VERSION = 2;

export interface PlayerSlot {
  team: "PC" | "NPC";
  active: boolean; // the slot whose turn it is right now
  past: boolean; // a slot already taken this round
  down: boolean; // a team slot gone dark (a member is downed)
  actorName?: string; // who's acting in the active slot (active slot only)
}

export interface PlayerParticipant {
  id: string; // opaque; lets a player pick who acts in an open slot
  name: string;
  team: "PC" | "NPC";
  acted: boolean; // has acted this round
  active: boolean; // currently acting
  down: boolean; // downed / defeated
}

export interface PlayerSkillChallenge {
  name: string;
  description?: string;
  successes: number;
  failures: number;
  targetSuccesses: number;
  allowedFailures: number;
  turnLimit?: number;
  currentTurn: number;
  status: "active" | "won" | "lost";
}

export interface PlayerDisplay {
  imageUrl: string;
  caption?: string;
}

/** The Destiny pool as the players see it: one entry per point, true = Light.
 * Sent as the raw array (not just counts) so a player can tap a specific point
 * to flip it. Empty when the GM has toggled the pool off or it's empty. */
export type PlayerDestiny = boolean[];

/** A dice result the GM has chosen to reveal to the table. */
export interface PlayerRoll {
  label?: string;
  netSuccess: number; // + success / - failure
  netAdvantage: number; // + advantage / - threat
  triumph: number;
  despair: number;
  poly?: { total: number; values: number[] };
  at: number;
}

export interface PlayerSnapshot {
  v: number;
  mode: "structured" | "non-structured";
  fsmState: string;
  round: number;
  currentTurnIndex: number;
  slots: PlayerSlot[];
  participants: PlayerParticipant[];
  skillChallenge: PlayerSkillChallenge | null;
  display: PlayerDisplay | null;
  destiny: PlayerDestiny;
  roll: PlayerRoll | null;
  updatedAt: number;
}

export interface SnapshotInputs {
  context: EncounterContext;
  participants: Participant[];
  fsmState: string;
  acted: string[];
  activeParticipantId: string | null;
  skillChallenge: SkillChallengeState | null;
  display: { imageUrl: string | null; caption: string | null };
  destiny: PlayerDestiny;
  roll: PlayerRoll | null;
  /** slot index → name of who acted there this round (history, cleared each
   * round). Tracked GM-side; see gmSync. */
  slotActors: Record<number, string>;
}

/**
 * Build a player snapshot from the GM's live state. `down` is computed here,
 * GM-side, via the same disabledSlotIndices helper the GM initiative bar uses.
 */
export function buildPlayerSnapshot(inputs: SnapshotInputs): PlayerSnapshot {
  const {
    context,
    participants,
    fsmState,
    acted,
    activeParticipantId,
    skillChallenge,
    display,
    destiny,
    roll,
    slotActors,
  } = inputs;
  const { initiativeOrder, currentTurnIndex, round, mode } = context;
  const down = disabledSlotIndices(initiativeOrder, participants);

  return {
    v: SNAPSHOT_VERSION,
    mode,
    fsmState,
    round,
    currentTurnIndex,
    slots: initiativeOrder.map((slot, i) => ({
      team: slot.team,
      active: i === currentTurnIndex && fsmState === "inProgress",
      past: i < currentTurnIndex,
      down: down.has(i),
      // History: who acted in this slot this round (active + past).
      actorName: slotActors[i],
    })),
    participants: participants.map((p) => ({
      id: p.id,
      name: p.name,
      team: p.isPC ? "PC" : "NPC",
      acted: acted.includes(p.id),
      active: p.id === activeParticipantId,
      down: isParticipantDead(p),
    })),
    skillChallenge: skillChallenge
      ? {
          name: skillChallenge.name,
          description: skillChallenge.description,
          successes: skillChallenge.successes,
          failures: skillChallenge.failures,
          targetSuccesses: skillChallenge.targetSuccesses,
          allowedFailures: skillChallenge.allowedFailures,
          turnLimit: skillChallenge.turnLimit,
          currentTurn: skillChallenge.currentTurn,
          status: skillChallenge.status,
        }
      : null,
    display: display.imageUrl
      ? { imageUrl: display.imageUrl, caption: display.caption ?? undefined }
      : null,
    destiny,
    roll,
    updatedAt: Date.now(),
  };
}

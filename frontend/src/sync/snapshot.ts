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
export const SNAPSHOT_VERSION = 4;

/** Coarse, GM-narration-style condition for an individual — a reminder of what
 * the GM says aloud ("definitely hurt but still in the fight"), never a number.
 * Bands map to remaining wounds: unhurt ≥50% (minor damage isn't telegraphed),
 * hurt ≥25%, badly ≥10%, critical <10%. Minion groups use the ×N count. */
export type HealthState = "unhurt" | "hurt" | "badly" | "critical";

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
  // Minion groups only: living members and original group size, so the table
  // sees the group thin out (e.g. "×4" → "×2"). Undefined for individuals.
  groupAlive?: number;
  groupTotal?: number;
  // Individuals only (Rivals/Nemeses/PCs): coarse condition band. Undefined for
  // minion groups (they read condition off the ×N count).
  health?: HealthState;
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

/** Map wounds vs threshold to a coarse, narration-style condition band. The
 * exact ratio is computed and discarded here; only the band leaves the GM. */
function coarseHealth(wounds: number, woundThreshold: number): HealthState {
  const remaining = Math.max(0, 1 - wounds / Math.max(woundThreshold, 1));
  if (remaining >= 0.5) return "unhurt"; // minor damage isn't telegraphed
  if (remaining >= 0.25) return "hurt"; // definitely hurt, still in the fight
  if (remaining >= 0.1) return "badly"; // badly injured
  return "critical"; // on its last leg
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
    participants: participants.map((p) => {
      const stats = p.stats ?? {};
      // Minion group: surface living / total so the table sees it thin out.
      let groupAlive: number | undefined;
      let groupTotal: number | undefined;
      let health: HealthState | undefined;
      if (stats.minions !== undefined) {
        const wt = stats.woundThreshold ?? 8;
        const wounds = stats.wounds ?? 0;
        groupTotal = stats.minions;
        groupAlive = Math.max(stats.minions - Math.floor(wounds / Math.max(wt, 1)), 0);
      } else {
        const wt = stats.woundThreshold ?? (p.isPC ? 12 : 8);
        health = coarseHealth(stats.wounds ?? 0, wt);
      }
      return {
        id: p.id,
        name: p.name,
        team: (p.isPC ? "PC" : "NPC") as "PC" | "NPC",
        acted: acted.includes(p.id),
        active: p.id === activeParticipantId,
        down: isParticipantDead(p),
        groupAlive,
        groupTotal,
        health,
      };
    }),
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

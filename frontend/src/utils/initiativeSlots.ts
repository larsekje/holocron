import { InitiativeSlot } from "@/types/initiativeSlot";
import { Participant, isParticipantDead, teamOf } from "@/state/participantsStore";

/**
 * SWRPG initiative slots belong to a team, not to a specific character — any
 * team member can act in any of their team's slots. So when a team loses
 * members it loses its *trailing* slots: count each team's dead and mark that
 * many slots disabled from the bottom (end) of the order upward.
 *
 * Single source of truth shared by the InitiativeOrder display and the FSM's
 * turn-advance skip logic, so the slots the GM sees greyed out are exactly
 * the ones turn progression skips.
 */
export function disabledSlotIndices(
  initiativeOrder: InitiativeSlot[],
  participants: Participant[],
): Set<number> {
  const remaining: Record<InitiativeSlot["team"], number> = { PC: 0, NPC: 0 };
  for (const p of participants) {
    if (!p.offstage && isParticipantDead(p)) remaining[teamOf(p)] += 1;
  }
  const disabled = new Set<number>();
  for (let i = initiativeOrder.length - 1; i >= 0; i--) {
    const team = initiativeOrder[i].team;
    if (remaining[team] > 0) {
      disabled.add(i);
      remaining[team] -= 1;
    }
  }
  return disabled;
}

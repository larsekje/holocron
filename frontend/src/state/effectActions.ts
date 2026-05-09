/**
 * Mechanical actions for triggered status effects.
 *
 * When a chip's behavior trigger fires (e.g. Bleeding Out at the start of the
 * bleeder's turn), the GM-reminder toast offers an "Apply now" button. This
 * registry tells that button what to do — apply wounds, add strain, etc.
 *
 * Effects whose only impact is narrative or a chip-borne dice modifier
 * (Off-Balance, Compromised, Slowed, …) return `undefined` here — the toast
 * shows "Acknowledge" instead.
 */
import { Participant } from "./participantsStore";
import useParticipantStore from "./participantsStore";
import { Effect } from "@/types/effectTypes";

/**
 * Returns a callback the toast can invoke. The callback applies the mechanical
 * impact and returns a short human-readable summary ("+1 wound, +1 strain")
 * for any post-apply confirmation surface.
 */
export type MechanicalAction = (p: Participant) => string;

export function mechanicalActionFor(effect: Effect): MechanicalAction | undefined {
  if (!effect.status) return undefined;

  switch (effect.status) {
    case "bleeding-out":
      return (p) => {
        const store = useParticipantStore.getState();
        store.addWounds(p.id, 1);
        store.addStrain(p.id, 1);
        return "+1 wound, +1 strain";
      };

    case "at-the-brink":
      return (p) => {
        useParticipantStore.getState().addStrain(p.id, 1);
        return "+1 strain";
      };

    case "burn": {
      const damage = effect.overTimeDamage ?? effect.rank ?? 1;
      return (p) => {
        useParticipantStore.getState().addWounds(p.id, damage);
        return `+${damage} wound${damage === 1 ? "" : "s"}`;
      };
    }

    // Reminders without a mechanical impact: Slowed, Distracted,
    // Temporarily Lame, End is Nigh, Mortally Wounded, Stunned (the staggered
    // effect itself blocks actions — the chip is the rule).
    default:
      return undefined;
  }
}

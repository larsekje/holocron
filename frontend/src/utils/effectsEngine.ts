import {
  Effect,
  EffectBehavior,
  ToastConfig,
  StatusType,
} from "@/types/effectTypes";

export type EffectTrigger = EffectBehavior["trigger"];

/**
 * Delta to apply to a participant for the current trigger.
 * Caller should integrate this into their store update (e.g., add wounds, enforce restrictions).
 */
export type ParticipantDelta = {
  // Positive numbers add damage/strain this tick; 0/undefined means no change.
  wounds?: number;
  strain?: number;

  // Dice pool modifier: add this many Setback to all checks (e.g., Disoriented X).
  addSetbacks?: number;

  // Action/maneuver gates (e.g., Staggered/Immobilized/Ensnared)
  cannotAct?: boolean;
  cannotManeuver?: boolean;

  // Positional state. For Prone/Knocked Down we mainly signal a reminder; standing up is a maneuver.
  prone?: boolean;

  // Freeform notes for the UI/log.
  notes?: string[];
};

export type DeltasByTarget = Record<string, ParticipantDelta>;

export type EffectResolution = {
  // Aggregated deltas by participantId (targets only of type 'character').
  deltasByParticipantId: DeltasByTarget;

  // Effects with updated durations (expired ones removed).
  updatedEffects: Effect[];

  // Toast-friendly messages to show in the UI for this trigger.
  toasts: ToastConfig[];
};

/**
 * Resolve and apply effects for a given trigger.
 * - Aggregates per-participant deltas (e.g., Burn damage, Disoriented setbacks, Staggered/Immobilized gates).
 * - Decrements effect durations if they are tied to this trigger.
 * - Removes expired effects and returns the updated list.
 */
export function resolveEffectsForTrigger(
  trigger: EffectTrigger,
  effects: Effect[],
  now: number = Date.now()
): EffectResolution {
  const toasts: ToastConfig[] = [];
  const deltas: DeltasByTarget = {};
  const updated: Effect[] = [];

  for (const eff of effects) {
    const matchesTrigger = eff.behavior?.trigger === trigger;

    // Only compute outcomes on matching trigger, but keep non-matching effects untouched.
    if (matchesTrigger) {
      const t = eff.target?.type;
      const pId = eff.target?.participantId;

      // Compute participant-facing outcomes for character targets.
      if (t === "character" && pId) {
        const delta = ensureDelta(deltas, pId);
        applyStatusOutcome(eff, delta, toasts);
      } else {
        // For initiative/global, just add a reminder toast if useful.
        const title = eff.name || eff.status || "Effect";
        toasts.push({
          title,
          description: eff.description ?? `Trigger: ${trigger}`,
          status: "info",
        });
      }
    }

    // Tick duration if this effect is tied to the fired trigger
    const newDuration =
      matchesTrigger && typeof eff.duration === "number"
        ? eff.duration - 1
        : eff.duration;

    // If duration reaches 0, expire the effect
    if (typeof newDuration === "number" && newDuration <= 0) {
      // Expire: optionally announce
      toasts.push({
        title: `${eff.name ?? eff.status ?? "Effect"} expired`,
        description: `Ended on ${trigger}`,
        status: "success",
      });
      continue; // Skip adding to updated list
    }

    updated.push({ ...eff, duration: newDuration });
  }

  return {
    deltasByParticipantId: deltas,
    updatedEffects: updated,
    toasts,
  };
}

/**
 * Convenience: compute current modifiers that should apply “right now” for a participant,
 * without ticking durations (useful when building a dice pool or validating actions).
 *
 * Example usage before a check:
 *   const mods = computeCurrentModifiers(effectsForParticipant);
 *   if (mods.cannotAct) block action; if (mods.addSetbacks) add Setback dice, etc.
 */
export function computeCurrentModifiers(effectsForParticipant: Effect[]): ParticipantDelta {
  const result: ParticipantDelta = {};
  for (const eff of effectsForParticipant) {
    applyStatusOutcome(eff, result);
  }
  return result;
}

/**
 * Apply the concrete outcome of a single effect into an accumulating ParticipantDelta.
 * Also pushes helpful toasts into the optional toasts array when appropriate.
 */
function applyStatusOutcome(
  eff: Effect,
  accum: ParticipantDelta,
  toasts?: ToastConfig[]
) {
  const s: StatusType | undefined = eff.status;

  switch (s) {
    case "staggered": {
      accum.cannotAct = true;
      pushNote(accum, "Staggered: cannot perform actions.");
      if (toasts) {
        toasts.push({
          title: "Staggered",
          description: "Cannot perform actions this turn.",
          status: "warning",
        });
      }
      break;
    }

    case "prone": {
      accum.prone = true;
      pushNote(accum, "Prone: stand up with a maneuver; melee/ranged modifiers apply.");
      if (toasts) {
        toasts.push({
          title: "Prone",
          description:
            "Treat as prone until the target spends a maneuver to stand.",
          status: "info",
        });
      }
      break;
    }

    case "disoriented": {
      const rank = eff.rank ?? 1;
      accum.addSetbacks = (accum.addSetbacks ?? 0) + rank;
      pushNote(accum, `Disoriented ${rank}: add ${rank} Setback to all checks.`);
      if (toasts) {
        toasts.push({
          title: `Disoriented ${rank}`,
          description: `Add ${rank} Setback to all checks while this lasts.`,
          status: "warning",
        });
      }
      break;
    }

    case "immobilized": {
      accum.cannotManeuver = true;
      pushNote(accum, "Immobilized: cannot perform maneuvers.");
      if (toasts) {
        toasts.push({
          title: "Immobilized",
          description: "Cannot perform maneuvers.",
          status: "warning",
        });
      }
      break;
    }

    case "ensnared": {
      accum.cannotManeuver = true;
      const rank = eff.rank ?? 1;
      pushNote(
        accum,
        `Ensnared ${rank}: cannot perform maneuvers (may attempt to break free per rules).`
      );
      if (toasts) {
        toasts.push({
          title: `Ensnared ${rank}`,
          description:
            "Cannot perform maneuvers; may attempt to break free as allowed by rules.",
          status: "warning",
        });
      }
      break;
    }

    case "knocked-down": {
      // Typically a single reminder that results in becoming prone.
      accum.prone = true;
      pushNote(
        accum,
        "Knocked Down: treat as Prone until a maneuver is spent to stand."
      );
      if (toasts) {
        toasts.push({
          title: "Knocked Down",
          description:
            "Treat as Prone until the target spends a maneuver to stand.",
          status: "info",
        });
      }
      break;
    }

    case "burn": {
      const dmg = eff.overTimeDamage ?? eff.rank ?? 1;
      // Burn usually applies at round-end; this function is generic, so callers should invoke on 'round-end'.
      if (typeof dmg === "number" && dmg > 0) {
        if (eff.overTimeType === "strain") {
          accum.strain = (accum.strain ?? 0) + dmg;
          pushNote(accum, `Burn: +${dmg} strain damage this tick.`);
        } else {
          accum.wounds = (accum.wounds ?? 0) + dmg;
          pushNote(accum, `Burn: +${dmg} wounds this tick.`);
        }
        if (toasts) {
          toasts.push({
            title: `Burn ${eff.rank ?? dmg}`,
            description:
              eff.overTimeType === "strain"
                ? `Suffers ${dmg} strain at this trigger.`
                : `Suffers ${dmg} wounds at this trigger.`,
            status: "warning",
          });
        }
      }
      break;
    }

    default: {
      // Unknown or non-status effects can still display a reminder
      if (eff.name || eff.description) {
        pushNote(
          accum,
          eff.description ??
            `Effect active${eff.duration ? ` (${eff.duration} left)` : ""}.`
        );
      }
      break;
    }
  }
}

/**
 * Utility: aggregate notes in the accumulated delta.
 */
function pushNote(accum: ParticipantDelta, note: string) {
  if (!accum.notes) accum.notes = [];
  accum.notes.push(note);
}

/**
 * Utility: ensure a delta accumulator for a target participant exists.
 */
function ensureDelta(map: DeltasByTarget, participantId: string): ParticipantDelta {
  if (!map[participantId]) {
    map[participantId] = {};
  }
  return map[participantId];
}

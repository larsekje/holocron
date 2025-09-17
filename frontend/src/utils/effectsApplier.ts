import { Effect, ToastConfig } from "@/types/effectTypes";
import {
  EffectTrigger,
  resolveEffectsForTrigger,
  ParticipantDelta,
  computeCurrentModifiers,
} from "@/utils/effectsEngine";

/**
 * Your effects manager can supply this callback to update participant state
 * (e.g., apply wounds/strain, enforce cannotAct/cannotManeuver, set prone).
 */
export type ParticipantDeltaHandler = (participantId: string, delta: ParticipantDelta) => void;

export type RunEffectsResult = {
  updatedEffects: Effect[];
  toasts: ToastConfig[];
};

/**
 * Run effects for a given trigger (e.g., 'turn-start', 'turn-end', 'round-end').
 * - Calls your onDelta for each participant with all aggregated modifiers (including staggered, disoriented, immobilized, ensnared, burn, prone/knocked-down).
 * - Returns updated effects (with durations ticked and expired effects removed) and toasts for UI.
 */
export function runEffectsTrigger(
  trigger: EffectTrigger,
  effects: Effect[],
  onDelta: ParticipantDeltaHandler
): RunEffectsResult {
  const res = resolveEffectsForTrigger(trigger, effects);

  // Forward per-participant deltas to your manager/store
  for (const [participantId, delta] of Object.entries(res.deltasByParticipantId)) {
    onDelta(participantId, delta);
  }

  return {
    updatedEffects: res.updatedEffects,
    toasts: res.toasts,
  };
}

/**
 * Compute current constraints for a single participant without ticking durations.
 * Use this before building a dice pool or validating whether an action/maneuver is allowed.
 */
export function getActionConstraints(effectsForParticipant: Effect[]) {
  const mods = computeCurrentModifiers(effectsForParticipant);
  return {
    canAct: !mods.cannotAct,
    canManeuver: !mods.cannotManeuver,
    addSetbacks: mods.addSetbacks ?? 0,
    prone: !!mods.prone,
    notes: mods.notes ?? [],
  };
}

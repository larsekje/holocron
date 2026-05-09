/**
 * useEffectReminder
 *
 * Wraps an Effect so that when its trigger fires, a reminder card appears in
 * the right-rail Sidebar (instead of a Chakra toast). The card has:
 *   - effect name + target name + description
 *   - "Apply now" button (when mechanicalActionFor returns a callback) — runs
 *     the mechanical action, logs the result, resolves the reminder.
 *   - "Skip" / "Acknowledge" button — resolves with skipped status.
 *
 * Effects with behavior.trigger === 'immediate' are passive dice modifiers
 * (Off-Balance, Compromised, …) — their impact lives on the chip itself, no
 * reminder needed.
 *
 * The hook signature is kept for callsite ergonomics but the implementation
 * is now hook-free; the returned function reads/writes stores directly.
 */
import { Effect } from "@/types/effectTypes";
import { mechanicalActionFor } from "@/state/effectActions";
import useSessionLogStore from "@/state/sessionLogStore";
import useParticipantStore from "@/state/participantsStore";

export type WrapEffect = (effect: Effect, fallbackTargetName: string) => Effect;

export function useEffectReminder(): WrapEffect {
  return (effect, fallbackTargetName) => {
    if (effect.behavior.trigger === "immediate") return effect;

    // Only wrap effects with a mechanical action — passive markers
    // (Disoriented, Immobilized, Compromised, …) live on the chip alone.
    // Wrapping them would fire a sidebar reminder every single turn, which
    // is the toast-noise problem in another form.
    const action = mechanicalActionFor(effect);
    if (!action) return effect;

    return {
      ...effect,
      apply: (p) => {
        const targetName = p?.name ?? fallbackTargetName;
        const participantId = p?.id ?? "";

        const log = useSessionLogStore.getState();
        log.addReminder({
          effectName: effect.name,
          description: effect.description,
          participantId,
          participantName: targetName,
          hasApplyAction: true,
          onApply: () => {
            // Resolve the live participant from the store (the closure's `p`
            // could be stale by the time the GM clicks).
            const live = useParticipantStore
              .getState()
              .participants.find((x) => x.id === participantId);
            const summary = action(live ?? (p as never));
            log.log({
              kind: "damage",
              participantId,
              participantName: targetName,
              summary: `${effect.name}: ${summary}`,
              tone: "bad",
            });
          },
          onSkip: undefined,
        });
      },
    };
  };
}

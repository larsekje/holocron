/**
 * sessionLogStore — the right-rail Sidebar's data source.
 *
 * Two slices:
 *   reminders: unresolved Apply/Skip prompts (e.g. Bleeding Out fires at the
 *              start of the bleeder's turn → a reminder card appears in the
 *              Sidebar with Apply now / Skip buttons; replaces the old toast).
 *   timeline:  append-only log of session events (round/turn boundaries,
 *              effect added/removed, damage, crit applied, resolved
 *              reminders).
 *
 * When the GM clicks Apply / Skip on a reminder, the reminder is removed from
 * `reminders` and a corresponding `reminder-resolved` entry is pushed to the
 * timeline so the GM has a record of what they did.
 */
import { create } from "zustand";
import { nanoid } from "nanoid";
import { addGameEventListener } from "./eventSystem";
import useParticipantStore, { isParticipantDead } from "./participantsStore";

export type LogKind =
  | "encounter-start"
  | "encounter-end"
  | "round-start"
  | "round-end"
  | "turn-start"
  | "turn-end"
  | "effect-added"
  | "effect-removed"
  | "crit-applied"
  | "damage"
  | "reminder-resolved"
  | "skill-challenge-start"
  | "skill-challenge-end";

export interface LogEntry {
  id: string;
  kind: LogKind;
  at: number;                         // Date.now() at log time
  // Best-effort context — fields populated as available
  round?: number;
  participantId?: string;
  participantName?: string;
  // Free-form summary the Sidebar can render: e.g. "Off-Balance" or
  // "+1 wound, +1 strain" or "Round 2 begins".
  summary: string;
  // Severity hint for styling (info / warn / good / bad). Optional.
  tone?: "info" | "warn" | "good" | "bad";
  // Original effect/critical metadata, for resolved-reminder rows.
  meta?: Record<string, unknown>;
}

export interface Reminder {
  id: string;
  effectName: string;
  description?: string;
  participantId: string;
  participantName: string;
  at: number;
  // Has the GM already done it (Apply now)? Set true so the Sidebar can
  // collapse the card before the resolve handler runs cleanup.
  /** Hook the Sidebar wires up. */
  onApply?: () => void;
  onSkip?: () => void;
  hasApplyAction: boolean;            // true → "Apply now" button visible
}

interface SessionLogStore {
  reminders: Reminder[];
  timeline: LogEntry[];
  /** When set, the next observed wound delta for this participant id is
   * dropped — used by combat Apply to fold the auto-emitted "Dave: +4
   * wounds" into the combined attacker→target log entry. */
  suppressedWoundFor: string | null;

  log: (entry: Omit<LogEntry, "id" | "at"> & Partial<Pick<LogEntry, "at">>) => void;

  /** Fold-on-write for wound/strain deltas; condenses rapid +/- clicks. */
  logStatDelta: (
    participantId: string,
    participantName: string,
    statType: "wounds" | "strain",
    delta: number,
    total: number,
  ) => void;

  /** Replace the summary of the most recent damage entry that carries the
   * given rollId in meta. Used by combat Apply to upgrade an existing roll
   * log into a fuller "X shot Y for N" line. */
  rewriteLastDamageForRoll: (rollId: string, summary: string) => void;

  /** One-shot: drop the next wound delta auto-log for this participant. */
  suppressNextWoundLog: (participantId: string) => void;

  addReminder: (
    r: Omit<Reminder, "id" | "at"> & Partial<Pick<Reminder, "at">>,
  ) => string;
  resolveReminder: (id: string, outcome: "applied" | "skipped") => void;

  clearTimeline: () => void;
  clearReminders: () => void;
}

const useSessionLogStore = create<SessionLogStore>((set, get) => ({
  reminders: [],
  timeline: [],
  suppressedWoundFor: null,

  rewriteLastDamageForRoll: (rollId, summary) =>
    set((state) => {
      for (let i = state.timeline.length - 1; i >= 0; i--) {
        const e = state.timeline[i];
        if (e.kind === "damage" && (e.meta?.rollId as string | undefined) === rollId) {
          const updated: LogEntry = { ...e, summary, at: Date.now() };
          const next = state.timeline.slice();
          next[i] = updated;
          return { timeline: next };
        }
      }
      return state;
    }),

  suppressNextWoundLog: (participantId) => set({ suppressedWoundFor: participantId }),

  log: (entry) =>
    set((state) => ({
      timeline: [
        ...state.timeline,
        { id: nanoid(), at: entry.at ?? Date.now(), ...entry } as LogEntry,
      ],
    })),

  /**
   * Fold-on-write: rapid +/- clicks on the wound/strain bar would otherwise
   * spam the log. Sums the delta into the previous entry when:
   *   - it's the immediately preceding timeline entry
   *   - same participant
   *   - same stat type (`wounds` or `strain`)
   * Anything in between (a turn-start, an effect-add, …) breaks the run, so
   * the next delta becomes its own entry.
   */
  logStatDelta: (
    participantId: string,
    participantName: string,
    statType: "wounds" | "strain",
    delta: number,
    total: number,
  ) => {
    set((state) => {
      const last = state.timeline[state.timeline.length - 1];
      const word =
        statType === "wounds"
          ? Math.abs(delta) === 1
            ? "wound"
            : "wounds"
          : "strain";

      if (
        last &&
        last.kind === "damage" &&
        last.participantId === participantId &&
        (last.meta?.statType as string | undefined) === statType
      ) {
        const oldDelta = (last.meta?.delta as number | undefined) ?? 0;
        const newDelta = oldDelta + delta;
        // Sum-folded delta might wash to zero (e.g., +1 then -1 = no net
        // change). In that case drop the entry — nothing happened.
        if (newDelta === 0) {
          return { timeline: state.timeline.slice(0, -1) };
        }
        const sign = newDelta > 0 ? "+" : "";
        const foldedWord =
          statType === "wounds"
            ? Math.abs(newDelta) === 1
              ? "wound"
              : "wounds"
            : "strain";
        const updated: LogEntry = {
          ...last,
          at: Date.now(),
          summary: `${participantName}: ${sign}${newDelta} ${foldedWord} (now ${total})`,
          tone: newDelta > 0 ? (statType === "wounds" ? "bad" : "warn") : "good",
          meta: { ...last.meta, statType, delta: newDelta, total },
        };
        return {
          timeline: [...state.timeline.slice(0, -1), updated],
        };
      }

      const sign = delta > 0 ? "+" : "";
      const fresh: LogEntry = {
        id: nanoid(),
        at: Date.now(),
        kind: "damage",
        participantId,
        participantName,
        summary: `${participantName}: ${sign}${delta} ${word} (now ${total})`,
        tone: delta > 0 ? (statType === "wounds" ? "bad" : "warn") : "good",
        meta: { statType, delta, total },
      };
      return { timeline: [...state.timeline, fresh] };
    });
  },

  addReminder: (r) => {
    const id = nanoid();
    set((state) => ({
      reminders: [
        ...state.reminders,
        { id, at: r.at ?? Date.now(), ...r } as Reminder,
      ],
    }));
    return id;
  },

  resolveReminder: (id, outcome) => {
    const reminder = get().reminders.find((r) => r.id === id);
    if (!reminder) return;
    // Drop from active reminders, then drop a resolved entry into the timeline.
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
      timeline: [
        ...state.timeline,
        {
          id: nanoid(),
          kind: "reminder-resolved",
          at: Date.now(),
          participantId: reminder.participantId,
          participantName: reminder.participantName,
          summary:
            outcome === "applied"
              ? `Applied ${reminder.effectName} → ${reminder.participantName}`
              : `Skipped ${reminder.effectName} → ${reminder.participantName}`,
          tone: outcome === "applied" ? "good" : "info",
          meta: { effectName: reminder.effectName, outcome },
        },
      ],
    }));
  },

  clearTimeline: () => set({ timeline: [] }),
  clearReminders: () => set({ reminders: [] }),
}));

// ── Subscriptions ──────────────────────────────────────────────────────────
// Wire game events into the timeline. Verbose-by-default (TURN_END /
// ROUND_END are skipped to keep the rail readable); add more if needed.
addGameEventListener((event) => {
  const log = useSessionLogStore.getState().log;
  switch (event.type) {
    case "ENCOUNTER_START": {
      // Auto-number by counting prior encounter-start entries in the log.
      const prior = useSessionLogStore.getState().timeline.filter(
        (e) => e.kind === "encounter-start",
      ).length;
      log({
        kind: "encounter-start",
        summary: `Encounter ${prior + 1} begins`,
        tone: "good",
        meta: { encounterNumber: prior + 1 },
      });
      break;
    }
    case "ROUND_START":
      log({
        kind: "round-start",
        round: event.round,
        summary: event.round ? `Round ${event.round} begins` : "Round begins",
        tone: "info",
      });
      break;
    case "TURN_START": {
      const p = event.participantId
        ? useParticipantStore
            .getState()
            .participants.find((x) => x.id === event.participantId)
        : undefined;
      log({
        kind: "turn-start",
        participantId: event.participantId,
        participantName: p?.name,
        summary: p ? `${p.name}'s turn` : "Turn begins",
        tone: "info",
      });
      break;
    }
    case "ENCOUNTER_END": {
      const number = useSessionLogStore.getState().timeline.filter(
        (e) => e.kind === "encounter-start",
      ).length;
      log({
        kind: "encounter-end",
        summary: number ? `Encounter ${number} ended` : "Encounter ended",
        tone: "warn",
        meta: { encounterNumber: number },
      });
      // Stale reminders make no sense once the encounter ends.
      useSessionLogStore.getState().clearReminders();
      break;
    }
    default:
      break; // TURN_END / ROUND_END / TURN_ACTION are intentionally skipped.
  }
});

// Diff-based participant subscription: logs joins, departures, deaths, and
// wound/strain deltas. All keyed by participant id (not name) so duplicates
// don't collide. Captured-name approach for departures means we can still
// say "Trooper has left the encounter" after the participant is gone.
interface PrevParticipant {
  name: string;
  wounds: number;
  strain: number;
  dead: boolean;
}
let prevById = new Map<string, PrevParticipant>();

useParticipantStore.subscribe((state) => {
  const log = useSessionLogStore.getState().log;
  const newById = new Map<string, PrevParticipant>();

  for (const p of state.participants) {
    const wounds = p.stats?.wounds ?? 0;
    // Strain isn't typed on the stats interface; cast to read it.
    const strain = (p.stats as Record<string, number> | undefined)?.strain ?? 0;
    const dead = isParticipantDead(p);
    newById.set(p.id, { name: p.name, wounds, strain, dead });

    const prev = prevById.get(p.id);

    if (!prev) {
      // Joined.
      log({
        kind: "effect-added",
        participantId: p.id,
        participantName: p.name,
        summary: `${p.name} has joined the encounter`,
        tone: "info",
      });
    } else {
      // Wound / strain deltas — fold-on-write so rapid +/- clicks collapse
      // into a single entry as long as nothing else is logged in between.
      if (wounds !== prev.wounds) {
        const store = useSessionLogStore.getState();
        // Combat Apply asks us to drop this delta because it's already
        // reflected in the combined "X shot Y for N wounds" line.
        if (store.suppressedWoundFor === p.id) {
          useSessionLogStore.setState({ suppressedWoundFor: null });
        } else {
          store.logStatDelta(p.id, p.name, "wounds", wounds - prev.wounds, wounds);
        }
      }
      if (strain !== prev.strain) {
        useSessionLogStore
          .getState()
          .logStatDelta(p.id, p.name, "strain", strain - prev.strain, strain);
      }
    }

    // Killed (transition to dead — once per participant).
    if (dead && (!prev || !prev.dead)) {
      // Skip the "killed" line if this is the first time we've ever seen the
      // participant AND they're already dead — that's a load artifact.
      if (prev) {
        log({
          kind: "damage",
          participantId: p.id,
          participantName: p.name,
          summary: `${p.name} was killed`,
          tone: "bad",
        });
      }
    }
  }

  // Departures — id was in prev but isn't in new. Use the captured name.
  for (const [id, snapshot] of prevById) {
    if (!newById.has(id)) {
      log({
        kind: "effect-removed",
        participantId: id,
        participantName: snapshot.name,
        summary: `${snapshot.name} has left the encounter`,
        tone: "warn",
      });
    }
  }

  prevById = newById;
});

export default useSessionLogStore;

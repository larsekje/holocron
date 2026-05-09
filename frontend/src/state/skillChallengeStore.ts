/**
 * skillChallengeStore — running tracker for a multi-roll skill challenge
 * (chase, slicing run, marathon negotiation, investigation lead).
 *
 * Core mechanic per Holocron v2 PDF p. 15: gain N uncancelled successes
 * before M failures. Optional secondary cap: an "X turns" time limit
 * (PDF p. 15 difficulty table). The GM judges each roll narratively and
 * clicks +Success / +Failure / Next Turn to feed the tally. Status auto-flips
 * to 'won' / 'lost' at the thresholds; the GM can still undo a misclick.
 *
 * Lifecycle events (start, won, lost, ended) are pushed to sessionLogStore so
 * the right-rail captures the arc. Per-increment changes are intentionally
 * NOT logged — the panel itself is the running display, and logging every
 * click would drown the timeline.
 */
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import useSessionLogStore from './sessionLogStore';

export type SkillChallengeStatus = 'active' | 'won' | 'lost';

export interface SkillChallengeEntry {
  id: string;
  type: 'success' | 'failure' | 'turn-advance';
  label?: string;
  at: number;
}

export interface SkillChallengeState {
  id: string;
  name: string;
  description?: string;
  /** Core stop conditions — succ target and failure cap are always tracked. */
  targetSuccesses: number;
  allowedFailures: number;
  /** Optional secondary cap (PDF p. 15 column "Turns"). When set, the
   * challenge is also lost if currentTurn exceeds it. */
  turnLimit?: number;
  successes: number;
  failures: number;
  /** 1-indexed: starts at 1, advances via nextTurn(). Only meaningful when
   * turnLimit is set. */
  currentTurn: number;
  history: SkillChallengeEntry[];
  status: SkillChallengeStatus;
  startedAt: number;
}

interface StartConfig {
  name: string;
  description?: string;
  targetSuccesses: number;
  allowedFailures: number;
  turnLimit?: number;
}

interface SkillChallengeStore {
  active: SkillChallengeState | null;
  start: (config: StartConfig) => void;
  addSuccess: (label?: string) => void;
  addFailure: (label?: string) => void;
  nextTurn: () => void;
  undoLast: () => void;
  end: () => void;
}

/** Difficulty presets per Holocron v2 PDF p. 15 (Skill Challenge table). The
 * "Tough" row spans 15–20 successes; we pick 18 as the middle ground. None of
 * the rows specify a failure cap — the PDF uses turns as the time limit. */
export const SKILL_CHALLENGE_PRESETS: Array<{
  id: 'light' | 'medium' | 'hard' | 'tough';
  label: string;
  targetSuccesses: number;
  turnLimit: number;
}> = [
  { id: 'light',  label: 'Light',  targetSuccesses: 10, turnLimit: 5 },
  { id: 'medium', label: 'Medium', targetSuccesses: 10, turnLimit: 3 },
  { id: 'hard',   label: 'Hard',   targetSuccesses: 15, turnLimit: 5 },
  { id: 'tough',  label: 'Tough',  targetSuccesses: 18, turnLimit: 3 },
];

function recomputeStatus(s: SkillChallengeState): SkillChallengeStatus {
  if (s.successes >= s.targetSuccesses) return 'won';
  if (s.failures >= s.allowedFailures) return 'lost';
  if (s.turnLimit != null && s.currentTurn > s.turnLimit) return 'lost';
  return 'active';
}

const useSkillChallengeStore = create<SkillChallengeStore>((set, get) => ({
  active: null,

  start: (config) => {
    const fresh: SkillChallengeState = {
      id: nanoid(),
      name: config.name,
      description: config.description,
      targetSuccesses: Math.max(1, config.targetSuccesses),
      allowedFailures: Math.max(1, config.allowedFailures),
      turnLimit: config.turnLimit != null ? Math.max(1, config.turnLimit) : undefined,
      successes: 0,
      failures: 0,
      currentTurn: 1,
      history: [],
      status: 'active',
      startedAt: Date.now(),
    };
    set({ active: fresh });
    const caps = [
      `${fresh.targetSuccesses} succ`,
      `${fresh.allowedFailures} fail`,
      fresh.turnLimit != null ? `${fresh.turnLimit} turns` : null,
    ]
      .filter(Boolean)
      .join(' / ');
    useSessionLogStore.getState().log({
      kind: 'skill-challenge-start',
      summary: `Skill challenge started: ${fresh.name} (${caps})`,
      tone: 'info',
      meta: { challengeId: fresh.id, name: fresh.name },
    });
  },

  addSuccess: (label) => {
    const cur = get().active;
    if (!cur || cur.status !== 'active') return;
    const entry: SkillChallengeEntry = {
      id: nanoid(),
      type: 'success',
      label,
      at: Date.now(),
    };
    const next: SkillChallengeState = {
      ...cur,
      successes: cur.successes + 1,
      history: [...cur.history, entry],
    };
    next.status = recomputeStatus(next);
    set({ active: next });
    if (next.status === 'won') {
      useSessionLogStore.getState().log({
        kind: 'skill-challenge-end',
        summary: `Skill challenge won: ${next.name} (${next.successes}/${next.targetSuccesses})`,
        tone: 'good',
        meta: { challengeId: next.id, name: next.name, outcome: 'won' },
      });
    }
  },

  addFailure: (label) => {
    const cur = get().active;
    if (!cur || cur.status !== 'active') return;
    const entry: SkillChallengeEntry = {
      id: nanoid(),
      type: 'failure',
      label,
      at: Date.now(),
    };
    const next: SkillChallengeState = {
      ...cur,
      failures: cur.failures + 1,
      history: [...cur.history, entry],
    };
    next.status = recomputeStatus(next);
    set({ active: next });
    if (next.status === 'lost') {
      useSessionLogStore.getState().log({
        kind: 'skill-challenge-end',
        summary: `Skill challenge lost: ${next.name} (${next.failures}/${next.allowedFailures} failures)`,
        tone: 'bad',
        meta: { challengeId: next.id, name: next.name, outcome: 'lost' },
      });
    }
  },

  nextTurn: () => {
    const cur = get().active;
    if (!cur || cur.status !== 'active') return;
    const entry: SkillChallengeEntry = {
      id: nanoid(),
      type: 'turn-advance',
      at: Date.now(),
    };
    const next: SkillChallengeState = {
      ...cur,
      currentTurn: cur.currentTurn + 1,
      history: [...cur.history, entry],
    };
    next.status = recomputeStatus(next);
    set({ active: next });
    if (next.status === 'lost') {
      useSessionLogStore.getState().log({
        kind: 'skill-challenge-end',
        summary: `Skill challenge lost: ${next.name} (out of time after ${next.turnLimit} turn${next.turnLimit === 1 ? '' : 's'})`,
        tone: 'bad',
        meta: { challengeId: next.id, name: next.name, outcome: 'lost' },
      });
    }
  },

  undoLast: () => {
    const cur = get().active;
    if (!cur || cur.history.length === 0) return;
    const last = cur.history[cur.history.length - 1];
    const next: SkillChallengeState = {
      ...cur,
      successes: cur.successes - (last.type === 'success' ? 1 : 0),
      failures: cur.failures - (last.type === 'failure' ? 1 : 0),
      currentTurn: cur.currentTurn - (last.type === 'turn-advance' ? 1 : 0),
      history: cur.history.slice(0, -1),
    };
    next.status = recomputeStatus(next);
    set({ active: next });
  },

  end: () => {
    const cur = get().active;
    if (!cur) return;
    // Only log an "ended early" line if the GM bailed mid-challenge — won/lost
    // already produced their own outcome lines.
    if (cur.status === 'active') {
      const parts = [
        `${cur.successes}/${cur.targetSuccesses} succ`,
        `${cur.failures}/${cur.allowedFailures} fail`,
        cur.turnLimit != null ? `turn ${cur.currentTurn}/${cur.turnLimit}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      useSessionLogStore.getState().log({
        kind: 'skill-challenge-end',
        summary: `Skill challenge abandoned: ${cur.name} (${parts})`,
        tone: 'warn',
        meta: { challengeId: cur.id, name: cur.name, outcome: 'abandoned' },
      });
    }
    set({ active: null });
  },
}));

export default useSkillChallengeStore;

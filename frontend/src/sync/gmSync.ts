/**
 * gmSync — the GM-side bridge for the player-facing synced view.
 *
 * Outbound: while sharing, any change to the encounter (turn order, round,
 * participant wounds, skill challenge, pushed image, Destiny pool, revealed
 * roll) triggers a debounced POST of the snapshot to the relay. A heartbeat
 * also republishes so players converge regardless of ordering and recover if
 * the relay restarts.
 *
 * Inbound: players can act back (tap a Destiny point to flip it, tap a PC slot
 * to advance the turn). Those arrive over an SSE "actions" stream and are
 * applied to the GM's own stores. Anyone with the link can do this — it's the
 * GM's table, by design.
 */
import { nanoid } from "nanoid";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantsStore from "@/state/participantsStore";
import useSkillChallengeStore from "@/state/skillChallengeStore";
import usePlayerDisplayStore from "@/state/playerDisplayStore";
import usePlayerSettingsStore from "@/state/playerSettingsStore";
import { useDestinyStore } from "@/state/destinyPoolStore";
import useRevealedRollStore from "@/state/revealedRollStore";
import { getSyncBaseUrl } from "./syncBaseUrl";
import { buildPlayerSnapshot } from "./snapshot";

const DEBOUNCE_MS = 200;
const HEARTBEAT_MS = 4000;

let roomId: string | null = null;
const unsubs: Array<() => void> = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let actionSource: EventSource | null = null;

// Per-round history of who acted in which slot, cleared when the round changes.
let slotActors: Record<number, string> = {};
let historyRound = -1;

function currentSnapshot() {
  const gp = useGameplayStore.getState();
  const ctx = gp.context;
  const participants = useParticipantsStore.getState().participants;
  const display = usePlayerDisplayStore.getState();
  const showDestiny = usePlayerSettingsStore.getState().showDestiny;
  const pool = useDestinyStore.getState().destinyPool;

  // Update the slot-actor history from the live state.
  if (ctx.round !== historyRound) {
    slotActors = {};
    historyRound = ctx.round;
  }
  if (ctx.activeParticipantId) {
    const name = participants.find((p) => p.id === ctx.activeParticipantId)?.name;
    if (name) slotActors = { ...slotActors, [ctx.currentTurnIndex]: name };
  }

  return buildPlayerSnapshot({
    context: ctx,
    participants,
    fsmState: gp.state,
    acted: ctx.actedParticipants,
    activeParticipantId: ctx.activeParticipantId,
    skillChallenge: useSkillChallengeStore.getState().active,
    display: { imageUrl: display.imageUrl, caption: display.caption },
    // Send the raw pool so players can tap to flip; empty when toggled off.
    destiny: showDestiny ? [...pool] : [],
    roll: useRevealedRollStore.getState().roll,
    slotActors,
  });
}

async function publish() {
  if (!roomId) return;
  const body = JSON.stringify(currentSnapshot());
  try {
    await fetch(`${getSyncBaseUrl()}/sync/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Relay down / offline — players show "Reconnecting…" and recover on the
    // next publish (the heartbeat guarantees one comes soon).
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(publish, DEBOUNCE_MS);
}

// Apply an action a player sent back through the relay.
function applyAction(action: {
  type?: string;
  index?: number;
  participantId?: string;
}) {
  switch (action.type) {
    case "flipDestiny":
      if (typeof action.index === "number") {
        useDestinyStore.getState().flipDestinyPoint(action.index);
      }
      break;
    case "setActive":
      // A player picked who acts in an open slot. The GM can still override.
      if (action.participantId) {
        useGameplayStore.getState().setActiveParticipantId(action.participantId);
      }
      break;
    case "endTurn": {
      // Drive the turn to completion in one tap. From turn_start (a participant
      // selected but their turn not yet "started") NEXT_TURN only advances to
      // turn_active, so step through both phases here.
      const gp = useGameplayStore.getState();
      // Only end the turn the player was looking at. Next also skips empty
      // slots now, so a double tap (or a tap that lands after the GM moved
      // on) must not pass the following slot or end someone else's turn.
      if (!gp.context.activeParticipantId) break;
      if (action.participantId && action.participantId !== gp.context.activeParticipantId) break;
      if (gp.context.turnState === "turn_start") {
        gp.transition("NEXT_TURN"); // turn_start -> turn_active
      }
      gp.transition("NEXT_TURN"); // turn_active -> complete & advance
      break;
    }
  }
}

function shareUrlFor(id: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("pcview", id);
  url.hash = "";
  return url.toString();
}

const ROOM_ID_KEY = "holocron:shareRoomId";

/**
 * The room id is stable across sessions and reloads. There is exactly one shared
 * table screen, so its ?pcview=<id> link must be permanent (bookmark-able): we
 * persist a single id in localStorage and reuse it forever. The table screen's
 * link then keeps working through GM reloads, crashes, and re-shares, instead of
 * being orphaned by a fresh per-session id.
 */
function getOrCreateRoomId(): string {
  try {
    const existing = localStorage.getItem(ROOM_ID_KEY);
    if (existing) return existing;
    const id = nanoid();
    localStorage.setItem(ROOM_ID_KEY, id);
    return id;
  } catch {
    // localStorage blocked (private mode) — fall back to an ephemeral id.
    return nanoid();
  }
}

// Player taps (Destiny flips, turn picks) arrive on this stream. EventSource
// reconnects by itself after a network drop, but gives up for good (CLOSED)
// when the relay answers with an HTTP error — e.g. mid-restart behind a
// proxy. Outbound publishing keeps working on the heartbeat, so the table
// screen looks healthy while every tap goes nowhere. Reopen with backoff.
let actionRetry: ReturnType<typeof setTimeout> | null = null;
let actionBackoffMs = 1000;

function openActionChannel(): void {
  if (!roomId) return;
  const es = new EventSource(`${getSyncBaseUrl()}/sync/${roomId}/actions`);
  actionSource = es;
  es.onopen = () => {
    actionBackoffMs = 1000;
  };
  es.onmessage = (e) => {
    try {
      applyAction(JSON.parse(e.data));
    } catch {
      /* malformed / keepalive — ignore */
    }
  };
  es.onerror = () => {
    if (es.readyState !== EventSource.CLOSED || actionSource !== es) return;
    actionRetry = setTimeout(() => {
      actionRetry = null;
      if (actionSource === es) openActionChannel();
    }, actionBackoffMs);
    actionBackoffMs = Math.min(actionBackoffMs * 2, 15000);
  };
}

export function startSharing(): { roomId: string; shareUrl: string } {
  if (roomId) return { roomId, shareUrl: shareUrlFor(roomId) };
  roomId = getOrCreateRoomId();
  slotActors = {};
  historyRound = -1;

  // Outbound: republish on any change to the stores the player view reflects.
  unsubs.push(useGameplayStore.subscribe(schedule));
  unsubs.push(useParticipantsStore.subscribe(schedule));
  unsubs.push(useSkillChallengeStore.subscribe(schedule));
  unsubs.push(usePlayerDisplayStore.subscribe(schedule));
  unsubs.push(usePlayerSettingsStore.subscribe(schedule));
  unsubs.push(useDestinyStore.subscribe(schedule));
  unsubs.push(useRevealedRollStore.subscribe(schedule));

  // Inbound: listen for player actions.
  openActionChannel();

  void publish();
  heartbeat = setInterval(publish, HEARTBEAT_MS);
  return { roomId, shareUrl: shareUrlFor(roomId) };
}

export function stopSharing(): void {
  while (unsubs.length) unsubs.pop()?.();
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  if (actionRetry) {
    clearTimeout(actionRetry);
    actionRetry = null;
  }
  if (actionSource) {
    actionSource.close();
    actionSource = null;
  }
  roomId = null;
}

// During dev, Vite HMR hot-swaps this module and resets its singletons
// (roomId, the action EventSource) while shareStore still thinks we're
// sharing. Tear the old connections down, then resume in the new module
// instance — the room id is persisted, so it's the same room and the table
// screen never notices.
if (import.meta.hot) {
  if (import.meta.hot.data.wasSharing) startSharing();
  import.meta.hot.dispose((data) => {
    data.wasSharing = roomId !== null;
    stopSharing();
  });
}

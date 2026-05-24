import { getSyncBaseUrl } from "./syncBaseUrl";

/**
 * Player → GM reverse channel: send an action (tap-to-flip Destiny, PC advancing
 * a turn) to the relay, which forwards it to the GM. Fire-and-forget.
 */
export function postAction(roomId: string, action: Record<string, unknown>): void {
  try {
    void fetch(`${getSyncBaseUrl()}/sync/${roomId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
      keepalive: true,
    });
  } catch {
    /* best effort — the GM will re-broadcast state on its heartbeat anyway */
  }
}

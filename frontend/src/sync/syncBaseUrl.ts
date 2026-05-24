/**
 * Resolve the backend origin for the player-sync relay.
 *
 * The player view connects to the same host it loaded the page from (just a
 * different port), so the GM MUST open the app via the machine's LAN IP
 * (e.g. http://192.168.1.20:8000) rather than localhost — otherwise the share
 * link embeds a host the players' devices can't reach. Override with the
 * VITE_SYNC_BASE env var if the backend lives elsewhere.
 */
export function getSyncBaseUrl(): string {
  const override = import.meta.env.VITE_SYNC_BASE as string | undefined;
  if (override) return override.replace(/\/$/, "");

  const { protocol, hostname } = window.location;
  // The host is derived from the page (so the player connects back to the same
  // LAN host). Only the port differs. Defaults: dev :8080, prod :32781.
  // VITE_SYNC_PORT overrides the port when the backend runs elsewhere
  // (e.g. :8081 to avoid a local port clash) without hardcoding the LAN IP.
  const port =
    (import.meta.env.VITE_SYNC_PORT as string | undefined) ||
    (import.meta.env.DEV ? "8080" : "32781");
  return `${protocol}//${hostname}:${port}`;
}

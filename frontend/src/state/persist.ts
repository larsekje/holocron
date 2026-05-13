/**
 * persist — thin wrapper over zustand's `persist` middleware for the
 * holocron stores.
 *
 * All saved keys live under the `holocron:v1:` namespace. The `v1` lets
 * us nuke every existing save in one go (bump to v2) without writing
 * per-store migrations — fine while the GM has no irreplaceable
 * persisted history.
 *
 * Nuking the state for debugging:
 *   - URL param `?reset` — clears storage on next load. Module-load side
 *     effect below intercepts before any store hydrates.
 *   - `window.__nukeHolocron()` from the browser console — clears and
 *     reloads.
 *   - Dev-only "Nuke" button in the Sidebar footer (see SidebarNukeButton).
 */
import type { PersistOptions } from 'zustand/middleware';

const KEY_PREFIX = 'holocron:v1:';

/** Build a PersistOptions object with our key prefix baked in. Callers
 * pass the unprefixed `name` plus an optional `partialize` (the list of
 * state fields to actually save — default zustand behavior is to save
 * everything, including functions, which we don't want). */
export function holocronPersist<S extends object, P = S>(opts: {
  name: string;
  partialize?: (state: S) => P;
  onRehydrateStorage?: (state: S) => ((state: S | undefined, error?: unknown) => void) | void;
}): PersistOptions<S, P> {
  return {
    name: KEY_PREFIX + opts.name,
    partialize: opts.partialize,
    onRehydrateStorage: opts.onRehydrateStorage,
    version: 1,
  };
}

/** Remove every `holocron:v1:*` key from localStorage. Does not reload —
 * use `nukeAndReload` for the typical debugging gesture. */
export function clearHolocronStorage(): void {
  if (typeof window === 'undefined') return;
  const toDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(KEY_PREFIX)) toDelete.push(key);
  }
  for (const key of toDelete) window.localStorage.removeItem(key);
}

/** Clear all holocron storage and hard-reload. The reload strips the
 * `?reset` query param so a paste-and-load won't loop. */
export function nukeAndReload(): void {
  clearHolocronStorage();
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('reset');
  window.location.replace(url.toString());
}

// Module-load side effect. Runs before any store that imports
// `holocronPersist` from this module is created — which means it
// fires before zustand's persist middleware hydrates any of them.
//
// `?reset`: clear storage and strip the param from the URL (so the
// fresh load doesn't see it). No reload needed — we're still pre-
// hydration.
//
// `__nukeHolocron`: console-accessible escape hatch in every build.
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.has('reset')) {
    clearHolocronStorage();
    params.delete('reset');
    const search = params.toString();
    const next =
      window.location.pathname +
      (search ? `?${search}` : '') +
      window.location.hash;
    window.history.replaceState({}, '', next);
  }
  (window as any).__nukeHolocron = nukeAndReload;
}

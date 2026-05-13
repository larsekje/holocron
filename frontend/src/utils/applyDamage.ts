import useParticipantStore from '@/state/participantsStore';
import useSessionLogStore from '@/state/sessionLogStore';

export interface DamageApplication {
  applied: number;
  soak: number;
  raw: number;
}

// Subtracts the target's soak from the raw damage, clamps to zero, and
// applies the result via addWounds. Returns the resolved numbers so callers
// can surface "8 raw − 3 soak = 5 wounds" in the UI without re-deriving.
//
// Soak-piercing or strain-only damage should call addWounds / addStrain
// directly — this helper is for the standard hit-on-target path the GM
// enters when a player declares a successful attack.
//
// Logging: suppresses the auto-fold wound-delta log and emits its own
// non-foldable entry instead, so the D action keeps a distinct log line
// even when followed immediately by arrow-key +/-1 wound nudges.
export function applyDamageWithSoak(participantId: string, raw: number): DamageApplication {
  const store = useParticipantStore.getState();
  const log = useSessionLogStore.getState();
  const participant = store.participants.find((p) => p.id === participantId);
  const soak = participant?.stats?.soak ?? 0;
  const safeRaw = Math.max(0, Math.floor(raw));
  const applied = Math.max(0, safeRaw - soak);
  if (applied > 0) {
    log.suppressNextWoundLog(participantId);
    store.addWounds(participantId, applied);
    const after = useParticipantStore.getState().participants.find((p) => p.id === participantId);
    const total = after?.stats?.wounds ?? 0;
    log.log({
      kind: 'damage',
      participantId,
      participantName: participant?.name,
      summary: `${participant?.name ?? 'Target'} took ${applied} wound${applied === 1 ? '' : 's'} (${safeRaw} − ${soak} soak)`,
      tone: 'bad',
      // No `statType` / `delta` in meta — the fold-on-write check in
      // sessionLogStore requires those fields. Omitting them prevents the
      // next +1 wound (e.g. arrow key) from absorbing this entry.
      meta: { source: 'damage-applied', raw: safeRaw, soak, applied, total },
    });
  } else {
    // All soaked. Still worth a log line — the GM should see that the hit
    // landed and was absorbed.
    log.log({
      kind: 'damage',
      participantId,
      participantName: participant?.name,
      summary: `${participant?.name ?? 'Target'}: ${safeRaw} damage soaked (soak ${soak})`,
      tone: 'good',
      meta: { source: 'damage-soaked', raw: safeRaw, soak, applied: 0 },
    });
  }
  return { applied, soak, raw: safeRaw };
}

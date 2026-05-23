/**
 * Drop a Spotlight-linked NPC into the live encounter as participant(s).
 * Shared by NPC rows and the tonight's-roster editor. Mirrors the minion /
 * multi-copy handling that NPCList uses inline. Returns a short summary for a
 * toast, or null if the entry isn't linked or its profile is missing.
 */
import { getDetail } from '@/data/spotlightIndex';
import adversaryService from '@/services/adversaryService';
import useParticipantStore from '@/state/participantsStore';

export interface AddableNpc {
  name: string;
  adversaryId?: string;
  count?: number;
}

export function addNpcToEncounter(npc: AddableNpc): { summary: string } | null {
  if (!npc.adversaryId) return null;
  const detail = getDetail('adversary', npc.adversaryId) as any;
  if (!detail) return null;

  const isMinion = (detail.adversaryType ?? detail.type) === 'Minion';
  const times = isMinion ? 1 : Math.max(1, npc.count ?? 1);
  const ps = useParticipantStore.getState();

  for (let i = 0; i < times; i++) {
    const p = adversaryService.convertToParticipant(detail);
    // Minion-group size override (a patrol's authored squad size).
    if (isMinion && npc.count && p.stats) p.stats.minions = npc.count;
    // Multiple rivals/nemeses get a numeric suffix so they're distinguishable.
    if (times > 1) p.name = `${p.name} ${i + 1}`;
    ps.addParticipant(p);
  }

  return {
    summary: isMinion
      ? `${detail.name} (minion group of ${npc.count ?? 4})`
      : times > 1
      ? `${detail.name} × ${times}`
      : detail.name,
  };
}

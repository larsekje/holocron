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
  // The entry's own name wins over the stat block's — dropping "Slipprigg"
  // (linked to a Slicer block) must add Slipprigg, not Slicer.
  const baseName = npc.name?.trim() || detail.name;
  const ps = useParticipantStore.getState();

  for (let i = 0; i < times; i++) {
    const p = adversaryService.convertToParticipant(detail);
    // Minion-group size override (a patrol's authored squad size).
    if (isMinion && npc.count && p.stats) p.stats.minions = npc.count;
    // Multiple rivals/nemeses get a numeric suffix so they're distinguishable.
    p.name = times > 1 ? `${baseName} ${i + 1}` : baseName;
    // When the GM gave it a custom name, keep the stat block's name as the
    // participant's originalName — the target card shows it beneath, so you can
    // see "Lib'Dua" *is* an Aqualish Thug.
    if (baseName !== detail.name) p.originalName = detail.name;
    ps.addParticipant(p);
  }

  return {
    summary: isMinion
      ? `${baseName} (minion group of ${npc.count ?? 4})`
      : times > 1
      ? `${baseName} × ${times}`
      : baseName,
  };
}

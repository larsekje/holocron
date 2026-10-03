import React from 'react';
import { HStack, Select, Text } from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';
import useParticipantStore, { isParticipantDead } from '@/state/participantsStore';
import { SKILLS } from '@/data/rulesReference';

// "Deception" → ["Discipline"]; "Stealth" → ["Perception", "Vigilance"].
function suggestedOpposition(skill: string | undefined): string[] {
  if (!skill) return [];
  const ref = SKILLS.find((s) => s.name.toLowerCase() === skill.toLowerCase());
  if (!ref?.opposedBy) return [];
  return ref.opposedBy
    .replace(/\(.*?\)/g, '')
    .split('/')
    .map((s) => s.trim())
    .filter((s) => SKILLS.some((k) => k.name === s));
}

const selectStyle = {
  size: 'xs' as const,
  variant: 'filled' as const,
  bg: 'gray.800',
  borderColor: 'gray.700',
  color: 'gray.100',
  _hover: { bg: 'gray.700' },
  sx: { '> option': { background: '#1A202C' } },
};

/**
 * Skill checks against a person: pick who opposes it and with which skill,
 * and the difficulty is rebuilt from their stats (see setOpposition).
 * Rendered for basic and opposed checks; picking "nobody" reverts to an
 * Average check.
 */
export const OppositionRow: React.FC<{ snapshot: ModalSnapshot }> = ({ snapshot }) => {
  const setOpposition = useDiceRollerStore((s) => s.setOpposition);
  const participants = useParticipantStore((s) => s.participants);
  const candidates = participants.filter(
    (p) => p.id !== snapshot.attackerParticipantId && !p.offstage && !isParticipantDead(p),
  );
  const suggested = suggestedOpposition(snapshot.skill);
  const defenderId = snapshot.defenderParticipantId ?? '';
  const defenderSkill = snapshot.defender?.skill ?? suggested[0] ?? snapshot.skill ?? 'Discipline';

  const others = SKILLS.filter((s) => !suggested.includes(s.name));

  return (
    <HStack spacing={2} px={1}>
      <Text fontSize="xs" color="gray.400" flexShrink={0}>Opposed by</Text>
      <Select
        {...selectStyle}
        maxW="200px"
        aria-label="Opposed by"
        value={defenderId}
        onChange={(e) => setOpposition(e.target.value || null, defenderSkill)}
      >
        <option value="">— nobody (set difficulty) —</option>
        {candidates.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
      <Text fontSize="xs" color="gray.400" flexShrink={0}>using</Text>
      <Select
        {...selectStyle}
        maxW="200px"
        aria-label="Opposing skill"
        value={defenderSkill}
        isDisabled={!defenderId}
        onChange={(e) => setOpposition(defenderId || null, e.target.value)}
      >
        {suggested.length > 0 && (
          <optgroup label="Usual">
            {suggested.map((s) => <option key={s} value={s}>{s}</option>)}
          </optgroup>
        )}
        <optgroup label="All skills">
          {others.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </optgroup>
      </Select>
    </HStack>
  );
};

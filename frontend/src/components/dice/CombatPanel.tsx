import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';
import WeaponCardOld from '@components/statblock/WeaponCardOld';
import MiniStatCard from '@components/target/MiniStatCard';
import type { WeaponLike } from '@/utils/diceSnapshots';

interface Props {
  snapshot: ModalSnapshot;
}

// Bridge the snapshot's flattened weapon (already-resolved damage, qualities
// as {name, rank}) to the WeaponLike shape WeaponCardOld expects. plusDamage
// stays undefined here — the snapshot's `damage` is the final value already.
function snapshotWeaponToLike(weapon: NonNullable<ModalSnapshot['weapon']>): WeaponLike {
  return {
    name: weapon.name,
    skill: weapon.skill,
    damage: weapon.damage,
    crit: weapon.crit,
    range: weapon.range,
    qualities: (weapon.qualities ?? []).map((q) =>
      q.rank != null ? `${q.name} ${q.rank}` : q.name,
    ),
  };
}

// Combat-mode header: full weapon card (so the GM can read damage/crit/
// qualities + tooltip them) plus the auto-derived target line. Range is
// changed via the Range list on the right (DifficultyRangeList in combat
// mode). Damage breakdown lives below the Roll button in CombatDamagePanel.
export const CombatPanel: React.FC<Props> = ({ snapshot }) => {
  const { weapon, target } = snapshot;

  if (!weapon) {
    return (
      <Text fontSize="sm" color="gray.500">
        Combat mode requires a weapon.
      </Text>
    );
  }

  const weaponLike = snapshotWeaponToLike(weapon);

  return (
    <Box>
      <WeaponCardOld weapon={weaponLike} />
      {target && (
        <Box mt={2}>
          {/* MiniStatCard reads selectedParticipantId from the participant
              store. The dice roller's `snapshot.targetParticipantId` is set
              from the same selection at roll-open time, so the card here
              reflects the actual target. Wounds/strain/effects/pouch can
              even be managed in-place while the roll resolves. */}
          <MiniStatCard />
        </Box>
      )}
    </Box>
  );
};

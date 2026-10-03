import React from 'react';
import {
  Box,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  SimpleGrid,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { GiSwapBag } from 'react-icons/gi';
import { ReactComponent as BoostSvg } from '@/assets/dice/boost.svg';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as ForceSvg } from '@/assets/dice/force.svg';
import { ReactComponent as ProficiencySvg } from '@/assets/dice/proficiency.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';
import useParticipantStore, { type DicePouch, type Participant } from '@/state/participantsStore';
import useSessionLogStore from '@/state/sessionLogStore';
import { pouchIconString } from '@/state/quickActionsStore';
import HotkeyHint from '@components/quickActions/HotkeyHint';

interface PouchOption {
  key: keyof DicePouch;
  label: string;
  iconClass?: string;
  Svg?: React.ComponentType<{ width?: number | string }>;
  upgrade?: boolean;
}

// Dice first (the common grants), then symbols, then upgrades.
const OPTIONS: PouchOption[] = [
  { key: 'boost', label: 'Boost die', Svg: BoostSvg },
  { key: 'setback', label: 'Setback die', Svg: SetbackSvg },
  { key: 'force', label: 'Force die', Svg: ForceSvg },
  { key: 'advantage', label: 'Advantage', iconClass: 'icon advantage' },
  { key: 'threat', label: 'Threat', iconClass: 'icon threat' },
  { key: 'success', label: 'Success', iconClass: 'icon success' },
  { key: 'failure', label: 'Failure', iconClass: 'icon failure' },
  { key: 'triumph', label: 'Triumph', iconClass: 'icon triumph' },
  { key: 'despair', label: 'Despair', iconClass: 'icon despair' },
  { key: 'upgrade', label: 'Upgrade (Ability → Proficiency)', Svg: ProficiencySvg, upgrade: true },
  { key: 'upgradeDifficulty', label: 'Upgrade (Difficulty → Challenge)', Svg: ChallengeSvg, upgrade: true },
];

const Glyph: React.FC<{ opt: PouchOption }> = ({ opt }) => {
  if (opt.Svg) {
    return (
      <Box display="inline-flex" alignItems="center">
        {opt.upgrade && (
          <Text
            as="span"
            fontSize="12px"
            fontWeight="bold"
            lineHeight="1"
            mr="1px"
            color={opt.key === 'upgrade' ? 'yellow.300' : 'red.300'}
          >
            ↑
          </Text>
        )}
        <opt.Svg width={opt.upgrade ? 18 : 22} />
      </Box>
    );
  }
  return (
    <Box
      className={opt.iconClass}
      fontSize="18px"
      sx={{ '&, &::before, &::after': { color: 'whiteAlpha.900' } }}
    />
  );
};

/**
 * One-click deposits into a participant's dice pouch — the clickable
 * counterpart of the P quick-input ("3a", "u", …). Each click adds one and
 * logs it; the popover stays open so several can go in at once.
 */
const AddToPouchPopover: React.FC<{ participant: Participant }> = ({ participant }) => {
  const addDice = useParticipantStore((s) => s.addDice);

  const add = (opt: PouchOption) => {
    addDice(participant.id, opt.key, 1, 'GM');
    useSessionLogStore.getState().log({
      kind: 'effect-added',
      participantId: participant.id,
      participantName: participant.name,
      summary: `${pouchIconString(opt.key, 1)} was added to ${participant.name}'s pouch`,
      tone: 'info',
    });
  };

  return (
    <Popover placement="bottom-end" isLazy>
      <Box position="relative">
        <PopoverTrigger>
          <IconButton
            aria-label="Add to dice pouch"
            title="Add to dice pouch (P)"
            icon={<GiSwapBag size={14} />}
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
          />
        </PopoverTrigger>
        <HotkeyHint>P</HotkeyHint>
      </Box>
      {/* Portalled: rendered inline, the popper wrapper becomes an HStack
          child and inherits its spacing margin. */}
      <Portal>
      <PopoverContent bg="gray.800" borderColor="gray.600" color="gray.100" w="auto">
        <PopoverArrow bg="gray.800" />
        <PopoverBody p={2}>
          <Text
            fontSize="9px"
            letterSpacing="0.16em"
            textTransform="uppercase"
            color="gray.400"
            fontWeight="bold"
            mb={1.5}
          >
            Add to {participant.name}'s pouch
          </Text>
          <SimpleGrid columns={6} spacing={1}>
            {OPTIONS.map((opt) => (
              <Tooltip key={opt.key} label={opt.label} hasArrow openDelay={250} placement="top">
                <IconButton
                  aria-label={`Add ${opt.label}`}
                  icon={<Glyph opt={opt} />}
                  size="sm"
                  variant="ghost"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => add(opt)}
                />
              </Tooltip>
            ))}
          </SimpleGrid>
        </PopoverBody>
      </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default AddToPouchPopover;

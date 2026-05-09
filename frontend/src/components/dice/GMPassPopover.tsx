import React from 'react';
import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Tag,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { ReactComponent as BoostSvg } from '@/assets/dice/boost.svg';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as ForceSvg } from '@/assets/dice/force.svg';
import useParticipantStore, { type DicePouch } from '@/state/participantsStore';
import useSessionLogStore from '@/state/sessionLogStore';

interface PassOption {
  storeKey: keyof DicePouch;
  label: string;
  iconClass?: string;
  Svg?: React.ComponentType<{ width?: number | string }>;
}

const OPTIONS: PassOption[] = [
  { storeKey: 'boost',     label: 'Boost die',     Svg: BoostSvg },
  { storeKey: 'setback',   label: 'Setback die',   Svg: SetbackSvg },
  { storeKey: 'force',     label: 'Force die',     Svg: ForceSvg },
  { storeKey: 'advantage', label: 'Advantage',     iconClass: 'icon advantage' },
  { storeKey: 'threat',    label: 'Threat',        iconClass: 'icon threat' },
  { storeKey: 'triumph',   label: 'Triumph',       iconClass: 'icon triumph' },
  { storeKey: 'despair',   label: 'Despair',       iconClass: 'icon despair' },
  { storeKey: 'success',   label: 'Success',       iconClass: 'icon success' },
  { storeKey: 'failure',   label: 'Failure',       iconClass: 'icon failure' },
];

const OptionGlyph: React.FC<{ opt: PassOption }> = ({ opt }) => {
  if (opt.Svg) return <opt.Svg width={20} />;
  if (opt.iconClass) return <Box className={opt.iconClass} fontSize="18px" />;
  return null;
};

// GM-side tool: deposit any symbol or die directly into a participant's pouch
// without going through cost-tracked spends. Useful for narrative grants
// ("you start with a Boost from your prep") or moving symbols around the table.
export const GMPassPopover: React.FC = () => {
  const participants = useParticipantStore((s) => s.participants);
  const addDice = useParticipantStore((s) => s.addDice);
  const log = useSessionLogStore((s) => s.log);

  function deposit(opt: PassOption, recipientId: string, recipientName: string) {
    addDice(recipientId, opt.storeKey, 1, 'GM grant');
    log({
      kind: 'reminder-resolved',
      participantId: recipientId,
      participantName: recipientName,
      summary: `GM gave 1 ${opt.label} to ${recipientName}`,
      tone: 'info',
      meta: { gmPass: true, kind: opt.storeKey },
    });
  }

  return (
    <Popover placement="bottom-end" isLazy>
      <PopoverTrigger>
        <Button size="xs" variant="outline" colorScheme="purple">
          GM: Pass to…
        </Button>
      </PopoverTrigger>
      <PopoverContent
        bg="gray.800"
        borderColor="gray.700"
        color="gray.100"
        w="320px"
        maxH="60vh"
        overflowY="auto"
      >
        <PopoverArrow bg="gray.800" />
        <PopoverHeader borderColor="gray.700" py={2}>
          <Text
            fontSize="9px"
            letterSpacing="0.16em"
            textTransform="uppercase"
            color="gray.400"
            fontWeight="bold"
          >
            Pass a symbol or die
          </Text>
        </PopoverHeader>
        <PopoverBody p={2}>
          {participants.length === 0 ? (
            <Text fontSize="sm" color="gray.500" px={2} py={1}>
              No participants yet.
            </Text>
          ) : (
            <VStack align="stretch" spacing={0.5}>
              {OPTIONS.map((opt) => (
                <HStack
                  key={opt.storeKey}
                  spacing={2}
                  px={2}
                  py={1}
                  borderRadius="sm"
                  _hover={{ bg: 'whiteAlpha.50' }}
                  justify="space-between"
                >
                  <HStack spacing={2} flex="1" minW={0}>
                    <Box w="20px" display="flex" justifyContent="center">
                      <OptionGlyph opt={opt} />
                    </Box>
                    <Text fontSize="sm" color="gray.100">{opt.label}</Text>
                  </HStack>
                  <Menu placement="bottom-end" isLazy>
                    <Tooltip label={`Deposit 1 ${opt.label} into a participant's pouch`} placement="left" hasArrow openDelay={300}>
                      <MenuButton
                        as={Button}
                        size="xs"
                        variant="outline"
                        rightIcon={<ChevronDownIcon />}
                      >
                        To…
                      </MenuButton>
                    </Tooltip>
                    <MenuList bg="gray.800" borderColor="gray.700" maxH="240px" overflowY="auto">
                      {participants.map((p) => (
                        <MenuItem
                          key={p.id}
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                          onClick={() => deposit(opt, p.id, p.name)}
                        >
                          <HStack spacing={2} flex="1">
                            <Text fontSize="sm" color="gray.100">{p.name}</Text>
                            {p.isPC && <Tag size="sm" variant="subtle" colorScheme="blue">PC</Tag>}
                          </HStack>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </HStack>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

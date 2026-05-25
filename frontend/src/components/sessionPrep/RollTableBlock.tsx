import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { nanoid } from 'nanoid';
import type { RollTable, RollTableRow } from '@/data/encounterTemplates';
import { POLY_DICE, rollPolyDie, type PolyDie } from '@/engine/polyDice';

/** A row's key is a single number ("3") or an inclusive range ("1-2"). */
function rowMatches(key: string, value: number): boolean {
  const m = key.match(/^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/);
  if (!m) return false;
  const lo = parseInt(m[1], 10);
  const hi = m[2] ? parseInt(m[2], 10) : lo;
  return value >= Math.min(lo, hi) && value <= Math.max(lo, hi);
}

interface Props {
  table: RollTable;
  editable: boolean;
  onChange?: (table: RollTable) => void;
  onRemove?: () => void;
}

/**
 * A roll table on an encounter — e.g. "Threat spends" or a random complication
 * list. Rollable when it has a die (a roll highlights the matching row);
 * otherwise it's a static reference. Used editable on the encounter card and
 * read-only in the live active scene.
 */
const RollTableBlock: React.FC<Props> = ({ table, editable, onChange, onRemove }) => {
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const die = table.die as PolyDie | undefined;

  const patch = (p: Partial<RollTable>) => onChange?.({ ...table, ...p });
  const updateRow = (id: string, rp: Partial<RollTableRow>) =>
    patch({ rows: table.rows.map((r) => (r.id === id ? { ...r, ...rp } : r)) });
  const addRow = () => patch({ rows: [...table.rows, { id: nanoid(6), key: '', text: '' }] });
  const removeRow = (id: string) => patch({ rows: table.rows.filter((r) => r.id !== id) });

  return (
    <Box bg="#1f2225" borderWidth="1px" borderColor="whiteAlpha.150" borderRadius="md" p={2}>
      <HStack mb={1.5} spacing={1.5}>
        {editable ? (
          <Input
            value={table.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Table name (e.g. Threat spends)"
            size="xs"
            variant="flushed"
            fontWeight="semibold"
            color="whiteAlpha.900"
          />
        ) : (
          <Text fontSize="xs" fontWeight="semibold" color="whiteAlpha.900" flex="1">
            {table.title || 'Untitled table'}
          </Text>
        )}
        {editable && (
          <Select
            size="xs"
            w="68px"
            value={table.die ?? ''}
            onChange={(e) => patch({ die: e.target.value || undefined })}
            bg="#16181c"
            borderColor="whiteAlpha.200"
          >
            <option value="">—</option>
            {POLY_DICE.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        )}
        {die && (
          <Button size="xs" colorScheme="orange" variant="outline" onClick={() => setLastRoll(rollPolyDie(die))}>
            Roll {die}
            {lastRoll != null ? ` · ${lastRoll}` : ''}
          </Button>
        )}
        {editable && onRemove && (
          <IconButton
            aria-label="Remove table"
            icon={<CloseIcon boxSize="8px" />}
            size="xs"
            variant="ghost"
            color="whiteAlpha.500"
            _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
            onClick={onRemove}
          />
        )}
      </HStack>

      <VStack align="stretch" spacing={1}>
        {table.rows.map((r) => {
          const hit = lastRoll != null && rowMatches(r.key, lastRoll);
          return (
            <HStack
              key={r.id}
              spacing={1.5}
              align="center"
              bg={hit ? 'rgba(211,153,57,0.18)' : 'transparent'}
              borderRadius="sm"
              px={hit ? 1 : 0}
            >
              {editable ? (
                <>
                  <Input
                    value={r.key}
                    onChange={(e) => updateRow(r.id, { key: e.target.value })}
                    placeholder="1-2"
                    size="xs"
                    w="48px"
                    bg="#16181c"
                    borderColor="whiteAlpha.200"
                    textAlign="center"
                  />
                  <Input
                    value={r.text}
                    onChange={(e) => updateRow(r.id, { text: e.target.value })}
                    placeholder="result…"
                    size="xs"
                    flex="1"
                    bg="#16181c"
                    borderColor="whiteAlpha.200"
                  />
                  <IconButton
                    aria-label="Remove row"
                    icon={<CloseIcon boxSize="7px" />}
                    size="xs"
                    variant="ghost"
                    color="whiteAlpha.400"
                    onClick={() => removeRow(r.id)}
                  />
                </>
              ) : (
                <>
                  <Text fontSize="2xs" color={hit ? '#e8b85e' : 'whiteAlpha.500'} minW="34px" fontWeight={hit ? 'bold' : 'normal'}>
                    {r.key}
                  </Text>
                  <Text fontSize="xs" color={hit ? 'white' : 'whiteAlpha.800'} flex="1">
                    {r.text}
                  </Text>
                </>
              )}
            </HStack>
          );
        })}
        {editable && (
          <Button
            size="xs"
            variant="ghost"
            color="whiteAlpha.600"
            leftIcon={<AddIcon boxSize="7px" />}
            alignSelf="flex-start"
            onClick={addRow}
          >
            row
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default RollTableBlock;

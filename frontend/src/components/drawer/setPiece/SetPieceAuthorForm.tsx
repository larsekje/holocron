import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  SimpleGrid,
  Textarea,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { QuickAddEntry, SetPieceDraft, Tier } from "@/setPiece";

interface Props {
  draft: SetPieceDraft;
  onChange: (next: SetPieceDraft) => void;
}

const SetPieceAuthorForm = ({ draft, onChange }: Props) => {
  const patch = <K extends keyof SetPieceDraft>(key: K, value: SetPieceDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const updateQuickAdd = (index: number, next: Partial<QuickAddEntry>) => {
    const list = draft.quick_add.map((entry, i) => (i === index ? { ...entry, ...next } : entry));
    patch("quick_add", list);
  };

  const addQuickAddRow = () =>
    patch("quick_add", [...draft.quick_add, { ref: "", count: 1 }]);

  const removeQuickAddRow = (index: number) =>
    patch("quick_add", draft.quick_add.filter((_, i) => i !== index));

  return (
    <SimpleGrid columns={1} spacing={3}>
      <FormControl isRequired>
        <FormLabel fontSize="sm">Name</FormLabel>
        <Input value={draft.name} onChange={e => patch("name", e.target.value)} placeholder="Set piece name"/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Tier</FormLabel>
        <Select value={draft.tier} onChange={e => patch("tier", e.target.value as Tier)}>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Scene</FormLabel>
        <Textarea rows={2} value={draft.scene} onChange={e => patch("scene", e.target.value)}/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Battlefield</FormLabel>
        <Textarea rows={4} value={draft.battlefield} onChange={e => patch("battlefield", e.target.value)}/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Tactics (R1 / R2 / R3 / R4+)</FormLabel>
        <Textarea rows={5} value={draft.tactics} onChange={e => patch("tactics", e.target.value)}/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Suggested adversaries</FormLabel>
        <Textarea rows={2} value={draft.suggested_adversaries} onChange={e => patch("suggested_adversaries", e.target.value)}/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Quick-add roster</FormLabel>
        <Box>
          {draft.quick_add.map((entry, i) => (
            <HStack key={i} marginBottom={2}>
              <Input
                placeholder="Adversary name"
                value={entry.ref}
                onChange={e => updateQuickAdd(i, { ref: e.target.value })}
                flex="1"
              />
              <NumberInput
                value={entry.count}
                min={1}
                max={20}
                onChange={(_, n) => updateQuickAdd(i, { count: Number.isFinite(n) ? n : 1 })}
                width="90px"
              >
                <NumberInputField/>
                <NumberInputStepper>
                  <NumberIncrementStepper/>
                  <NumberDecrementStepper/>
                </NumberInputStepper>
              </NumberInput>
              <IconButton
                aria-label="Remove row"
                icon={<DeleteIcon/>}
                size="sm"
                onClick={() => removeQuickAddRow(i)}
              />
            </HStack>
          ))}
          <Button size="sm" leftIcon={<AddIcon/>} onClick={addQuickAddRow}>Add row</Button>
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Skill uses</FormLabel>
        <Textarea rows={4} value={draft.skill_uses} onChange={e => patch("skill_uses", e.target.value)}/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Dice spends</FormLabel>
        <Textarea rows={4} value={draft.dice_menu} onChange={e => patch("dice_menu", e.target.value)}/>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">GM notes</FormLabel>
        <Textarea rows={2} value={draft.gm_notes} onChange={e => patch("gm_notes", e.target.value)}/>
      </FormControl>
    </SimpleGrid>
  );
};

export default SetPieceAuthorForm;

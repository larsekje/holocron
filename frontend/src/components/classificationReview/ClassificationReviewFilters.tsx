import React from 'react';
import { Box, HStack, Input, Select, Tag, Wrap, WrapItem } from '@chakra-ui/react';

// Filter / group controls for the Classification Review list. The filter and
// group-by state lives in the modal; this component is presentational.

export type GroupBy = 'none' | 'coreArchetype' | 'faction';

export interface ReviewFilters {
  text: string;
  coreArchetype: string; // '' = any — the Role
  faction: string; // '' = any
  role: string; // '' = any — the derived Archetype bucket
  hideNamed: boolean; // hide unique/named characters
  hideAdventure: boolean; // hide pre-written-adventure NPCs
  flaggedOnly: boolean;
  noRationale: boolean; // no v4.2 classificationReason
}

// Named + adventure characters are hidden by default: the v4.2 classification
// pass was over non-named adversaries, so the review corpus is the generic
// profiles. Both are toggleable back on.
export const DEFAULT_FILTERS: ReviewFilters = {
  text: '',
  coreArchetype: '',
  faction: '',
  role: '',
  hideNamed: true,
  hideAdventure: true,
  flaggedOnly: false,
  noRationale: false,
};

interface Props {
  filters: ReviewFilters;
  onChange: (next: ReviewFilters) => void;
  groupBy: GroupBy;
  onGroupByChange: (g: GroupBy) => void;
  options: { coreArchetypes: string[]; factions: string[]; roles: string[] };
}

const borderCol = 'gray.700';
const headerBg = '#1f2226';

const ClassificationReviewFilters: React.FC<Props> = ({
  filters,
  onChange,
  groupBy,
  onGroupByChange,
  options,
}) => {
  const set = (patch: Partial<ReviewFilters>) => onChange({ ...filters, ...patch });

  const Toggle: React.FC<{ active: boolean; onClick: () => void; label: string; title: string }> = ({
    active,
    onClick,
    label,
    title,
  }) => (
    <Tag
      size="sm"
      colorScheme={active ? 'orange' : 'gray'}
      variant={active ? 'subtle' : 'outline'}
      cursor="pointer"
      onClick={onClick}
      title={title}
    >
      {label}
    </Tag>
  );

  return (
    <Box px={4} py={2.5} borderBottom="1px solid" borderColor={borderCol} bg={headerBg}>
      <Wrap spacing={2} align="center" shouldWrapChildren>
        <Input
          size="sm"
          maxW="220px"
          placeholder="Search adversaries…"
          value={filters.text}
          onChange={(e) => set({ text: e.target.value })}
          bg="#26292d"
          borderColor={borderCol}
          color="gray.100"
          _placeholder={{ color: 'gray.500' }}
        />
        <Select
          size="sm"
          maxW="190px"
          value={filters.coreArchetype}
          onChange={(e) => set({ coreArchetype: e.target.value })}
          bg="#26292d"
          borderColor={borderCol}
          color="gray.100"
          sx={{ option: { background: '#1f2226', color: '#e2e8f0' } }}
        >
          <option value="">Any role</option>
          {options.coreArchetypes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
        <Select
          size="sm"
          maxW="160px"
          value={filters.faction}
          onChange={(e) => set({ faction: e.target.value })}
          bg="#26292d"
          borderColor={borderCol}
          color="gray.100"
          sx={{ option: { background: '#1f2226', color: '#e2e8f0' } }}
        >
          <option value="">Any faction</option>
          {options.factions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
        <Select
          size="sm"
          maxW="150px"
          value={filters.role}
          onChange={(e) => set({ role: e.target.value })}
          bg="#26292d"
          borderColor={borderCol}
          color="gray.100"
          sx={{ option: { background: '#1f2226', color: '#e2e8f0' } }}
        >
          <option value="">Any archetype</option>
          {options.roles.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>

        <HStack spacing={1.5}>
          <Toggle
            active={filters.hideNamed}
            onClick={() => set({ hideNamed: !filters.hideNamed })}
            label="Hide named"
            title="Hide unique/named characters (e.g. Darth Vader)"
          />
          <Toggle
            active={filters.hideAdventure}
            onClick={() => set({ hideAdventure: !filters.hideAdventure })}
            label="Hide adventure"
            title="Hide characters that appear in a pre-written adventure"
          />
          <Toggle
            active={filters.flaggedOnly}
            onClick={() => set({ flaggedOnly: !filters.flaggedOnly })}
            label="Flagged only"
            title="Show only adversaries you've flagged"
          />
          <Toggle
            active={filters.noRationale}
            onClick={() => set({ noRationale: !filters.noRationale })}
            label="No rationale"
            title="Show only adversaries with no v4.2 classification rationale on file"
          />
        </HStack>

        <Select
          size="sm"
          maxW="160px"
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          bg="#26292d"
          borderColor={borderCol}
          color="gray.100"
          sx={{ option: { background: '#1f2226', color: '#e2e8f0' } }}
          title="Group the list"
        >
          <option value="none">No grouping</option>
          <option value="coreArchetype">Group by archetype</option>
          <option value="faction">Group by faction</option>
        </Select>
      </Wrap>
    </Box>
  );
};

export default ClassificationReviewFilters;

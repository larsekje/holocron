import React from 'react';
import { Box, Collapse, HStack, Text } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import usePrepUiStore from '@/state/prepUiStore';

interface Props {
  /** Stable key the collapsed state is persisted under. */
  sectionKey: string;
  label: string;
  count?: number;
  /** Open state when the GM hasn't toggled this section yet. */
  defaultOpen?: boolean;
  /** Right-aligned control (e.g. a "New" button). Clicks inside it don't
   * toggle the section. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A foldable section of the Session Prep panel — one consistent header
 * (chevron + uppercase label + count) for every prep block, with persisted
 * open/closed state. Replaces the old always-expanded SectionHeader so the GM
 * can fold away what they're not using tonight.
 */
const PrepSection: React.FC<Props> = ({ sectionKey, label, count, defaultOpen = true, action, children }) => {
  const collapsed = usePrepUiStore((s) => s.collapsed[sectionKey]);
  const setSection = usePrepUiStore((s) => s.setSection);
  const open = collapsed === undefined ? defaultOpen : !collapsed;

  return (
    <Box>
      <HStack
        justify="space-between"
        align="center"
        mb={open ? 1 : 0}
        cursor="pointer"
        role="button"
        onClick={() => setSection(sectionKey, !open)}
        _hover={{ '& .prep-section-label': { color: 'whiteAlpha.700' } }}
      >
        <HStack spacing={1} minW={0}>
          {open ? (
            <ChevronDownIcon color="whiteAlpha.400" boxSize="13px" />
          ) : (
            <ChevronRightIcon color="whiteAlpha.400" boxSize="13px" />
          )}
          <Text
            className="prep-section-label"
            fontSize="2xs"
            color="whiteAlpha.500"
            letterSpacing="0.16em"
            textTransform="uppercase"
            fontWeight="bold"
            transition="color 120ms"
          >
            {label}
            {count !== undefined && ` (${count})`}
          </Text>
        </HStack>
        {action && <Box onClick={(e) => e.stopPropagation()}>{action}</Box>}
      </HStack>
      <Collapse in={open} animateOpacity>
        <Box pb={0.5}>{children}</Box>
      </Collapse>
    </Box>
  );
};

export default PrepSection;

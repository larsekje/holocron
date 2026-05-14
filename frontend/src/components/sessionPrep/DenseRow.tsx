import React, { ReactNode, useState } from 'react';
import {
  Box,
  Collapse,
  HStack,
  Text,
  Tooltip,
} from '@chakra-ui/react';

/**
 * DenseRow — shared visual chrome for the Session Prep panel.
 *
 * A row is a single ~22px-tall line with:
 *   - left accent bar (color encodes type/severity)
 *   - optional small icon
 *   - truncated title
 *   - optional right-side meta chips
 *   - optional expandable body that drops in below on click
 *
 * Hover shows a tooltip when one is provided — useful for surfacing the
 * full text of something that's truncated on the row.
 */
interface Props {
  accentColor?: string;
  icon?: ReactNode;
  title: ReactNode;
  /** Secondary inline label, dimmer, also truncated. */
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
  body?: ReactNode;
  tooltip?: ReactNode;
  defaultOpen?: boolean;
  /** Optional click handler in addition to the expand toggle. */
  onClick?: () => void;
  /** True border colour when expanded — defaults to the accent at 55% alpha. */
  expandedBorderColor?: string;
}

const DenseRow: React.FC<Props> = ({
  accentColor,
  icon,
  title,
  subtitle,
  rightSlot,
  body,
  tooltip,
  defaultOpen = false,
  onClick,
  expandedBorderColor,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const expandable = !!body;

  const handleClick = () => {
    if (expandable) setOpen((v) => !v);
    onClick?.();
  };

  const interactive = expandable || !!onClick;
  const row = (
    <HStack
      onClick={interactive ? handleClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      align="center"
      spacing={1.5}
      w="100%"
      minH="22px"
      px={1.5}
      py={0.5}
      textAlign="left"
      cursor={interactive ? 'pointer' : 'default'}
      _hover={interactive ? { bg: 'whiteAlpha.50' } : undefined}
      transition="background-color 100ms"
    >
      {/* Left accent bar */}
      {accentColor && (
        <Box
          w="3px"
          alignSelf="stretch"
          bg={accentColor}
          borderRadius="full"
          flexShrink={0}
        />
      )}
      {icon && (
        <Box
          color={accentColor ?? 'whiteAlpha.700'}
          display="inline-flex"
          alignItems="center"
          flexShrink={0}
          fontSize="14px"
        >
          {icon}
        </Box>
      )}
      <Text
        color="white"
        fontSize="xs"
        fontWeight="medium"
        lineHeight="1.3"
        noOfLines={1}
        flex="1"
        minW={0}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          color="whiteAlpha.500"
          fontSize="2xs"
          lineHeight="1.3"
          noOfLines={1}
          maxW="55%"
          flexShrink={0}
        >
          {subtitle}
        </Text>
      )}
      {rightSlot && (
        <HStack spacing={1} flexShrink={0}>
          {rightSlot}
        </HStack>
      )}
    </HStack>
  );

  const wrapped = tooltip ? (
    <Tooltip
      label={tooltip}
      placement="left"
      hasArrow
      openDelay={300}
      bg="#1a1c1e"
      color="whiteAlpha.900"
      maxW="320px"
    >
      {row}
    </Tooltip>
  ) : (
    row
  );

  return (
    <Box
      bg="#26292d"
      borderWidth="1px"
      borderColor={
        open
          ? expandedBorderColor ?? accentColor ?? 'whiteAlpha.300'
          : 'whiteAlpha.150'
      }
      borderRadius="md"
      transition="border-color 120ms"
    >
      {wrapped}
      {body && (
        <Collapse in={open} animateOpacity>
          <Box px={2} pb={2} pt={0.5}>
            {body}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default DenseRow;
